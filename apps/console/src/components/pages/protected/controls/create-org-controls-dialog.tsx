'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { DocsSourceLink, TargetChecklist } from '@/components/shared/docs-help/suggestion-card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { LightbulbIcon, Link2, PencilLine, Sparkles, TriangleAlert } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { TruncatedCell } from '@repo/ui/data-table'
import { PlaceholderTextarea } from '@/components/shared/placeholder-textarea/placeholder-textarea'
import { Loader2 } from 'lucide-react'
import { docsHelpEnabled } from '@repo/dally/ai'
import { ControlControlSource, ControlControlStatus, MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { useAllOrgControls, useCreateControl, useGetControlMinifiedById, useTemplateControlsWithMappings } from '@/lib/graphql-hooks/control'
import { TEMPLATE_CONTROLS_WHERE } from '@/constants/standards'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { useDocsControlTitles, type DocsControlTitleInput } from '@/hooks/useDocsHelp'
import { SIMILARITY_THRESHOLD, isWeakTitle, templateControlRows, textSimilarity, type TExampleRow, type TExistingMatch, type TTemplateControl } from '@/lib/docs-help/example-controls'
import { useDocsHelpDrawer } from '@/components/shared/docs-help/docs-help-context'
import { hasPlaceholderText } from '@/components/shared/plate/plate-utils'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { useDismissible } from '@/hooks/useDismissible'
import { dismissItem, useDismissedItems } from '@/hooks/useDismissedItems'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export type TCreateOrgControlsTarget = {
  id: string
  refCode: string
  referenceFramework?: string | null
  description?: string | null
}

export type TControlSuggestionGroup = { row: TExampleRow; controls: TCreateOrgControlsTarget[] }

const dismissedKey = (frameworkControl: TCreateOrgControlsTarget) => `suggested-controls-dismissed:${frameworkControl.id}:${frameworkControl.referenceFramework ?? ''}`

const templateIndexKey = (refCode: string, referenceFramework?: string | null) => `${refCode.trim().toLowerCase()}|${(referenceFramework ?? '').trim().toLowerCase()}`

function useTemplateIndex(enabled: boolean) {
  const { controls, isPending, isError } = useTemplateControlsWithMappings({ where: TEMPLATE_CONTROLS_WHERE, enabled })

  const index = useMemo(() => {
    const map = new Map<string, TTemplateControl[]>()

    for (const control of controls) {
      if (!control.refCode) continue
      const template: TTemplateControl = { refCode: control.refCode, name: control.title, description: control.description, category: control.category, subcategory: control.subcategory }

      for (const related of control.relatedControls ?? []) {
        if (!related?.refCode) continue
        const key = templateIndexKey(related.refCode, related.referenceFramework)
        map.set(key, [...(map.get(key) ?? []), template])
      }
    }

    return map
  }, [controls])

  return { index, isLoading: enabled && isPending, isError: enabled && isError }
}

const NO_ROWS: TExampleRow[] = []

export function useResolvedSuggestions(frameworkControl: TCreateOrgControlsTarget | null, existingRefCodes: string[] | undefined, enabled: boolean) {
  const { dismissed } = useDismissedItems(frameworkControl ? dismissedKey(frameworkControl) : undefined)
  const {
    dismissed: settledAll,
    dismiss: markSettled,
    isResolved: isSettledResolved,
  } = useDismissible(frameworkControl ? `suggested-controls-settled:${frameworkControl.id}:${frameworkControl.referenceFramework ?? ''}` : 'suggested-controls-settled:none')
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const organizationName = getOrganizationByID(currentOrgId ?? '')?.node?.displayName

  const active = enabled && docsHelpEnabled && isSettledResolved && !settledAll
  const { index: templateIndex, isLoading: isTemplatesLoading, isError: isTemplatesError } = useTemplateIndex(active)
  const templates = useMemo(
    () => (frameworkControl ? (templateIndex.get(templateIndexKey(frameworkControl.refCode, frameworkControl.referenceFramework)) ?? []) : []),
    [templateIndex, frameworkControl],
  )

  const { controls: orgControlNodes, isLoading: isOrgControlsLoading, isError: isOrgControlsError } = useAllOrgControls({ enabled: active && templates.length > 0 })

  const existingKey = (existingRefCodes ?? []).join('|')

  const orgControls: TExistingMatch[] = useMemo(
    () => orgControlNodes.flatMap((node) => (node.id && node.refCode ? [{ id: node.id, refCode: node.refCode, description: node.description }] : [])),
    [orgControlNodes],
  )

  const rows = useMemo(() => resolveSuggestions(templates, existingKey, orgControls, dismissed, organizationName), [templates, existingKey, orgControls, dismissed, organizationName])

  // a failed lookup reads as "nothing to suggest", do not auto dismiss because of an error
  const isError = active && (isTemplatesError || (templates.length > 0 && isOrgControlsError))

  const settled = active && !isError && templates.length > 0 && !isOrgControlsLoading
  useEffect(() => {
    if (settled && rows.length === 0) markSettled()
  }, [settled, rows.length, markSettled])

  const isLoading = !isSettledResolved || (active && !isError && (isTemplatesLoading || (templates.length > 0 && isOrgControlsLoading)))
  return { rows: settledAll ? NO_ROWS : rows, isLoading, isError }
}

export const rowKey = (row: TExampleRow) => row.templateRefCode ?? row.refCode

function resolveSuggestions(templates: TTemplateControl[], existingKey: string, orgControls: TExistingMatch[], dismissed: string[] = [], organizationName?: string | null): TExampleRow[] {
  const dismissedSet = new Set(dismissed)
  const existingRefCodes = existingKey ? existingKey.split('|') : []
  const alreadyMapped = new Set(existingRefCodes.map((code) => code.trim().toLowerCase()))

  return (
    templateControlRows(
      templates,
      existingRefCodes,
      organizationName,
      orgControls.map((control) => control.refCode),
    )
      .map((row) => {
        // the backend maps the template, but an org may have written its own
        // equivalent under a different ref code — offer to map that instead
        const match =
          orgControls.find((c) => c.refCode.trim().toLowerCase() === row.refCode.trim().toLowerCase()) ??
          orgControls.find((c) => textSimilarity(`${row.refCode} ${row.description}`, `${c.refCode} ${c.description ?? ''}`) >= SIMILARITY_THRESHOLD)
        return match ? { ...row, existingMatch: match } : row
      })
      .filter((row) => !row.existingMatch || !alreadyMapped.has(row.existingMatch.refCode.trim().toLowerCase()))
      // the user deleted this suggestion before
      .filter((row) => !dismissedSet.has(rowKey(row).trim().toLowerCase()))
      // one-click maps first, then the rows that need writing
      .sort((a, b) => Number(!!b.existingMatch) - Number(!!a.existingMatch))
  )
}

export function CreateOrgControlsFromDocsButton({
  frameworkControl,
  existingRefCodes,
  onCreated,
  size,
}: {
  frameworkControl: TCreateOrgControlsTarget
  existingRefCodes?: string[]
  onCreated?: (ids: string[]) => void
  size?: 'sm'
}) {
  const [open, setOpen] = useState(false)
  const { rows, isLoading } = useResolvedSuggestions(frameworkControl, existingRefCodes, true)

  if (!docsHelpEnabled || isLoading || rows.length === 0) return null
  return (
    <>
      <Button
        variant="secondary"
        icon={<LightbulbIcon size={size === 'sm' ? 12 : 16} />}
        iconPosition="left"
        className={size === 'sm' ? 'h-6 max-w-full px-2 text-xs whitespace-nowrap' : undefined}
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
      >
        Suggest Controls
      </Button>
      <CreateOrgControlsDialog open={open} onOpenChange={setOpen} frameworkControl={frameworkControl} existingRefCodes={existingRefCodes} onCreated={onCreated} />
    </>
  )
}

function RemoveRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="secondary" className="h-7 shrink-0 whitespace-nowrap px-2.5 text-xs" aria-label={label} onClick={onClick}>
      Dismiss
    </Button>
  )
}

type TUseCreateOrgControlsRowsProps = {
  active: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (ids: string[], only?: TExampleRow) => void
} & (
  | { frameworkControl: TCreateOrgControlsTarget | null; existingRefCodes?: string[]; groups?: undefined }
  | { groups: TControlSuggestionGroup[]; frameworkControl?: undefined; existingRefCodes?: undefined }
)

export function useCreateOrgControlsRows({ active, onOpenChange, onCreated, ...props }: TUseCreateOrgControlsRowsProps) {
  const multiMode = !!props.groups
  const frameworkControl = multiMode ? null : props.frameworkControl
  const { rows: fetchedRows, isLoading } = useResolvedSuggestions(frameworkControl, multiMode ? undefined : props.existingRefCodes, active && !multiMode)
  const resolvedRows = multiMode ? props.groups.map((g) => g.row) : fetchedRows
  const targetsByRow = useMemo(
    () => new Map(multiMode ? props.groups.map((g) => [rowKey(g.row), g.controls]) : resolvedRows.map((row) => [rowKey(row), frameworkControl ? [frameworkControl] : []])),
    [multiMode, props.groups, resolvedRows, frameworkControl],
  )

  const { data: frameworkControlData } = useGetControlMinifiedById(multiMode ? undefined : frameworkControl?.id, active && !multiMode)
  const frameworkDescription = frameworkControlData?.control?.description

  const [deselectedTargets, setDeselectedTargets] = useState<Set<string>>(() => new Set())
  const targetKey = (row: TExampleRow, target: TCreateOrgControlsTarget) => `${rowKey(row)}::${target.id}`
  const selectedTargets = (row: TExampleRow) => (targetsByRow.get(rowKey(row)) ?? []).filter((target) => !deselectedTargets.has(targetKey(row, target)))
  const toggleTarget = (row: TExampleRow, target: TCreateOrgControlsTarget) =>
    setDeselectedTargets((current) => {
      const key = targetKey(row, target)
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const [rows, setRows] = useState<TExampleRow[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [creatingRowKeys, setCreatingRowKeys] = useState<string[]>([])
  const writtenTitlesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (isCreating) return
    setRows((current) =>
      resolvedRows.map((row) => {
        const edited = current.find((existing) => rowKey(existing) === rowKey(row))
        const written = writtenTitlesRef.current[rowKey(row)]
        const title = edited?.title || written || row.title
        return {
          ...row,
          // the user may have retitled, reworded or re-coded the row already
          refCode: edited?.refCode || row.refCode,
          title,
          description: edited?.description || row.description,
          titleFromAI: edited ? edited.titleFromAI : !!written && title === written,
        }
      }),
    )
  }, [resolvedRows, isCreating])

  const [requestedTitles, setRequestedTitles] = useState<DocsControlTitleInput[]>([])
  const [pendingTitleKeys, setPendingTitleKeys] = useState<string[]>([])
  const requestTitle = (row: TExampleRow) => {
    setPendingTitleKeys((current) => [...current, rowKey(row)])
    setRequestedTitles((current) => [...current, { refCode: rowKey(row), description: row.description }])
  }

  const titleTargets = useMemo(() => {
    const automatic = resolvedRows.filter((row) => !row.existingMatch && isWeakTitle(row.title, row.refCode)).map((row) => ({ refCode: rowKey(row), description: row.description }))
    const seen = new Set(automatic.map((control) => control.refCode))
    return [...automatic, ...requestedTitles.filter((control) => control.refCode && !seen.has(control.refCode))]
  }, [resolvedRows, requestedTitles])

  const { data: suggestedTitles } = useDocsControlTitles(titleTargets, active && docsHelpEnabled)

  useEffect(() => {
    if (!suggestedTitles?.length) return
    titleTargets.forEach((control, index) => {
      const suggested = suggestedTitles[index]
      if (suggested && control.refCode) writtenTitlesRef.current[control.refCode] = suggested
    })

    setPendingTitleKeys([])
    const requested = new Set(requestedTitles.map((control) => control.refCode))
    setRows((current) =>
      current.map((row) => {
        const suggested = writtenTitlesRef.current[rowKey(row)]
        // an asked-for title replaces whatever is there; an automatic one only fills a gap
        const wanted = suggested && (requested.has(rowKey(row)) || isWeakTitle(row.title, row.refCode))
        return wanted ? { ...row, title: suggested, titleFromAI: true } : row
      }),
    )
  }, [suggestedTitles, titleTargets, requestedTitles])

  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const { mutateAsync: createControl } = useCreateControl()
  const { mutateAsync: createMappedControl } = useCreateMappedControl()
  const { successNotification, errorNotification } = useNotification()

  useEffect(() => {
    if (!active) writtenTitlesRef.current = {}
  }, [active])

  const updateRow = (index: number, patch: Partial<TExampleRow>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const removeRow = (index: number) => {
    const removed = rows[index]
    if (removed) (targetsByRow.get(rowKey(removed)) ?? []).forEach((target) => dismissItem(dismissedKey(target), rowKey(removed), currentOrgId))
    setRows((current) => current.filter((_, i) => i !== index))
  }

  const included = rows.filter((row) => row.refCode.trim())

  // pass a single row to create just that one and leave the rest of the list alone
  const handleCreate = async (only?: TExampleRow) => {
    const batch = only ? [only] : included
    if ((!multiMode && !frameworkControl) || batch.length === 0) return
    if (only) setCreatingRowKeys((current) => [...current, rowKey(only)])
    else setIsCreating(true)
    try {
      const newIds: string[] = []
      const existingIds: string[] = []
      const mapCalls: Array<() => Promise<unknown>> = []

      for (const row of batch) {
        const targets = multiMode ? selectedTargets(row) : (targetsByRow.get(rowKey(row)) ?? (frameworkControl ? [frameworkControl] : []))
        if (targets.length === 0) continue

        let toId = row.existingMatch?.id
        if (!toId) {
          const result = await createControl({
            input: {
              refCode: row.refCode.trim(),
              title: row.title.trim() || undefined,
              description: row.description.trim() || undefined,
              status: ControlControlStatus.DRAFT,
              category: row.category,
              subcategory: row.subcategory,
              source: ControlControlSource.TEMPLATE,
            },
          })
          toId = result.createControl.control.id
          if (toId) newIds.push(toId)
        } else {
          existingIds.push(toId)
        }
        if (!toId) continue

        if (multiMode) {
          const id = toId
          mapCalls.push(() =>
            createMappedControl({
              input: {
                fromControlIDs: targets.map((t) => t.id),
                toControlIDs: [id],
                mappingType: MappedControlMappingType.PARTIAL,
                source: MappedControlMappingSource.MANUAL,
                confidence: 100,
                relation: `Resolved from gap panel for ${targets.map((t) => t.refCode).join(', ')}`,
              },
            }),
          )
        }
      }

      if (multiMode) {
        await Promise.all(mapCalls.map((call) => call()))
      } else if (frameworkControl) {
        const mappedIds = [...newIds, ...existingIds]
        if (mappedIds.length > 0) {
          await createMappedControl({
            input: {
              fromControlIDs: [frameworkControl.id],
              toControlIDs: mappedIds,
              mappingType: MappedControlMappingType.PARTIAL,
              source: MappedControlMappingSource.MANUAL,
              confidence: 100,
              relation: `Created from ${frameworkControl.referenceFramework ?? 'framework'} ${frameworkControl.refCode} example organization controls`,
            },
          })
        }
      }

      const parts = [newIds.length > 0 ? `Created ${newIds.length} draft control${newIds.length === 1 ? '' : 's'}` : '', existingIds.length > 0 ? `Mapped ${existingIds.length} existing` : '']
        .filter(Boolean)
        .join(', ')
      successNotification({
        title: parts || 'Mapped controls',
        description: multiMode ? undefined : `Mapped to ${frameworkControl?.refCode}`,
      })
      onCreated?.(newIds, only)
      // one row at a time leaves the rest of the list open to keep working through
      if (only) setRows((current) => current.filter((row) => rowKey(row) !== rowKey(only)))
      else onOpenChange(false)
      // the gap panel refetches the whole report once, when it closes
      if (!multiMode) queryClient.invalidateQueries({ queryKey: ['controls', 'report'] })
    } catch (error) {
      errorNotification({ title: 'Failed to create controls', description: parseErrorMessage(error) })
    } finally {
      if (only) setCreatingRowKeys((current) => current.filter((key) => key !== rowKey(only)))
      else setIsCreating(false)
    }
  }

  return {
    rows,
    isLoading,
    isCreating,
    creatingRowKeys,
    included,
    frameworkDescription,
    frameworkControl,
    multiMode,
    targetsByRow,
    selectedTargets,
    toggleTarget,
    updateRow,
    removeRow,
    requestTitle,
    pendingTitleKeys,
    handleCreate,
  }
}

type TCreateOrgControlsRowsListProps = {
  rows: TExampleRow[]
  isLoading: boolean
  emptyMessage: string
  updateRow: (index: number, patch: Partial<TExampleRow>) => void
  removeRow: (index: number) => void
  requestTitle: (row: TExampleRow) => void
  pendingTitleKeys: string[]
  targetsByRow?: Map<string, TCreateOrgControlsTarget[]>
  isTargetSelected?: (row: TExampleRow, target: TCreateOrgControlsTarget) => boolean
  onToggleTarget?: (row: TExampleRow, target: TCreateOrgControlsTarget) => void
  onCreateRow?: (row: TExampleRow) => void
  creatingRowKeys?: string[]
  className?: string
}

export function CreateOrgControlsRowsList({
  rows,
  isLoading,
  emptyMessage,
  updateRow,
  removeRow,
  requestTitle,
  pendingTitleKeys,
  targetsByRow,
  isTargetSelected,
  onToggleTarget,
  onCreateRow,
  creatingRowKeys,
  className,
}: TCreateOrgControlsRowsListProps) {
  const [editingKeys, setEditingKeys] = useState<Set<string>>(() => new Set())
  const [snapshots, setSnapshots] = useState<Record<string, TExampleRow>>({})
  const startEditing = (row: TExampleRow) => {
    setEditingKeys((current) => new Set([...current, rowKey(row)]))
    setSnapshots((current) => ({ ...current, [rowKey(row)]: row }))
  }
  const stopEditing = (row: TExampleRow) => {
    setEditingKeys((current) => {
      const next = new Set(current)
      next.delete(rowKey(row))
      return next
    })
    setSnapshots((current) => {
      const { [rowKey(row)]: _removed, ...rest } = current
      return rest
    })
  }
  const cancelEditing = (row: TExampleRow, index: number) => {
    const snapshot = snapshots[rowKey(row)]
    if (snapshot) updateRow(index, snapshot)
    stopEditing(row)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        Loading examples from the docs…
      </div>
    )
  }
  if (rows.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {rows.some((row) => !row.existingMatch) && (
        <div className="flex items-start gap-2.5 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3">
          <PencilLine size={16} className="mt-0.5 shrink-0 text-[var(--color-warning)]" />
          <p className="text-sm">
            <span className="font-medium">Edit these before creating them.</span>{' '}
            <span className="text-muted-foreground">
              They&apos;re generic examples, not customized to your organization. Ensure each one to match how your organization actually operates. Delete any that are not relevant to your
              organization. They will be created as drafts and mapped back to this standard control.
            </span>
          </p>
        </div>
      )}
      {rows.map((row, index) => {
        const editing = editingKeys.has(rowKey(row))
        const targets = targetsByRow?.get(rowKey(row)) ?? []
        const creatingRow = creatingRowKeys?.includes(rowKey(row))
        const rowAction = onCreateRow && (
          <Button
            type="button"
            variant="primary"
            className="h-7 shrink-0 whitespace-nowrap px-2.5 text-xs"
            disabled={creatingRow || !row.refCode.trim()}
            icon={creatingRow ? <Loader2 size={12} className="animate-spin" /> : row.existingMatch ? <Link2 size={12} /> : undefined}
            iconPosition="left"
            onClick={() => onCreateRow(row)}
          >
            {row.existingMatch ? 'Map' : 'Create'}
          </Button>
        )
        return (
          <div key={index} className={`rounded-md border p-3 space-y-2 ${!row.existingMatch && hasPlaceholderText(row.description) ? 'border-[var(--color-warning)]/50' : 'border-border'}`}>
            {row.existingMatch ? (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link2 size={14} className="text-muted-foreground" />
                    <span className="text-sm font-medium">Map existing {row.existingMatch.refCode}</span>
                  </div>
                  <TruncatedCell className="mt-1 text-xs text-muted-foreground">{row.description}</TruncatedCell>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {rowAction}
                  <RemoveRowButton onClick={() => removeRow(index)} label={`Remove ${row.existingMatch.refCode}`} />
                </div>
              </div>
            ) : editing ? (
              <>
                {hasPlaceholderText(row.description) && (
                  <p className="flex items-center gap-1.5 rounded-md bg-[var(--color-warning)]/10 px-2 py-1.5 text-xs">
                    <TriangleAlert size={12} className="shrink-0 text-[var(--color-warning)]" />
                    Contains template placeholder text (e.g. <code>{'{{ ... }}'}</code>) to review and fill in
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Input value={row.refCode} onChange={(e) => updateRow(index, { refCode: e.currentTarget.value })} placeholder="Ref code" className="w-36" />
                  <div className="flex-1">
                    <Input maxWidth value={row.title} onChange={(e) => updateRow(index, { title: e.currentTarget.value, titleFromAI: false })} placeholder="Title (optional)" />
                  </div>
                  {!row.titleFromAI && (
                    <button
                      type="button"
                      onClick={() => requestTitle(row)}
                      disabled={pendingTitleKeys.includes(rowKey(row)) || !row.description.trim()}
                      title={row.description.trim() ? 'Write a title from the description' : 'Add a description first'}
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    >
                      <Sparkles size={12} className="text-brand" />
                      {pendingTitleKeys.includes(rowKey(row)) ? 'Writing…' : 'Generate title'}
                    </button>
                  )}
                  {row.titleFromAI && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                      title="The docs gave no title for this control, so AI wrote one from the description below. The description itself is unchanged from the docs"
                    >
                      <Sparkles size={12} className="text-brand" />
                      AI-written title
                    </span>
                  )}
                  <RemoveRowButton onClick={() => removeRow(index)} label={`Remove ${row.refCode}`} />
                </div>
                <PlaceholderTextarea value={row.description} onChange={(description) => updateRow(index, { description })} placeholder="Description" rows={2} />
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="secondary" className="h-7 whitespace-nowrap px-2.5 text-xs" onClick={() => cancelEditing(row, index)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="primary" className="h-7 whitespace-nowrap px-2.5 text-xs" onClick={() => stopEditing(row)}>
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <>
                {hasPlaceholderText(row.description) && (
                  <p className="flex items-center gap-1.5 rounded-md bg-[var(--color-warning)]/10 px-2 py-1.5 text-xs">
                    <TriangleAlert size={12} className="shrink-0 text-[var(--color-warning)]" />
                    Contains template placeholder text (e.g. <code>{'{{ ... }}'}</code>) to review and fill in
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">{row.refCode}</span>
                      {row.title && <span className="text-sm font-medium">{row.title}</span>}
                    </div>
                    <TruncatedCell className="mt-1 text-xs text-muted-foreground" lineClamp={3}>
                      {row.description}
                    </TruncatedCell>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="icon" className="h-7 gap-1 px-2 text-xs" icon={<PencilLine size={12} />} iconPosition="left" onClick={() => startEditing(row)}>
                      Edit
                    </Button>
                    {rowAction}
                    <RemoveRowButton onClick={() => removeRow(index)} label={`Remove ${row.refCode}`} />
                  </div>
                </div>
              </>
            )}
            {targetsByRow && targets.length > 0 && (
              <TargetChecklist targets={targets} isSelected={(target) => (isTargetSelected ? isTargetSelected(row, target) : true)} onToggle={(target) => onToggleTarget?.(row, target)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function createOrgControlsSubmitLabel(included: TExampleRow[]) {
  const toCreate = included.filter((row) => !row.existingMatch).length
  const toMap = included.length - toCreate
  if (toCreate > 0 && toMap > 0) return `Create ${toCreate} + map ${toMap}`
  if (toMap > 0) return `Map ${toMap} existing control${toMap === 1 ? '' : 's'}`
  return `Create ${toCreate || ''} draft control${toCreate === 1 ? '' : 's'}`
}

type TCreateOrgControlsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (ids: string[]) => void
  frameworkControl: TCreateOrgControlsTarget | null
  existingRefCodes?: string[]
}

export function CreateOrgControlsDialog({ open, onOpenChange, onCreated, frameworkControl, existingRefCodes }: TCreateOrgControlsDialogProps) {
  const { rows, isLoading, isCreating, included, frameworkDescription, updateRow, removeRow, requestTitle, pendingTitleKeys, handleCreate } = useCreateOrgControlsRows({
    active: open,
    onOpenChange,
    onCreated,
    frameworkControl,
    existingRefCodes,
  })
  const { open: docsDrawerOpen, setOpen: setDocsDrawerOpen } = useDocsHelpDrawer()

  // non-modal so the global docs tab stays reachable underneath
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      {open && typeof document !== 'undefined' && createPortal(<div className="pointer-events-none fixed inset-0 z-40 bg-[rgb(0_0_0/42%)]" aria-hidden />, document.body)}
      <DialogContent
        className="sm:max-w-3xl"
        onInteractOutside={(e) => {
          if (docsDrawerOpen) e.preventDefault()
        }}
        onPointerDownCapture={() => {
          if (docsDrawerOpen) setDocsDrawerOpen(false)
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 pr-6">
            <span className="flex items-center gap-2">
              Create Org Controls from {frameworkControl?.refCode ?? ''} suggestions
              {rows.length > 0 && <CountBadge count={rows.length} />}
            </span>
            <DocsSourceLink
              label={`View ${frameworkControl?.refCode ?? ''} docs`}
              topic={{
                title: [frameworkControl?.referenceFramework, frameworkControl?.refCode].filter(Boolean).join(' '),
                query: `${frameworkControl?.referenceFramework ?? ''} ${frameworkControl?.refCode ?? ''}`.trim(),
                prefer: frameworkControl?.refCode,
              }}
            />
          </DialogTitle>
        </DialogHeader>

        {frameworkDescription && (
          <div className="rounded-md border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{[frameworkControl?.referenceFramework, frameworkControl?.refCode].filter(Boolean).join(' - ')}</p>
            <TruncatedCell className="mt-1 text-sm text-muted-foreground" lineClamp={3}>
              {frameworkDescription}
            </TruncatedCell>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          <CreateOrgControlsRowsList
            rows={rows}
            isLoading={isLoading}
            emptyMessage={`The docs have no example organization controls for ${frameworkControl?.referenceFramework} ${frameworkControl?.refCode}.`}
            updateRow={updateRow}
            removeRow={removeRow}
            requestTitle={requestTitle}
            pendingTitleKeys={pendingTitleKeys}
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={() => handleCreate()} disabled={isCreating || included.length === 0} icon={isCreating ? <Loader2 className="animate-spin" /> : undefined} iconPosition="left">
            {createOrgControlsSubmitLabel(included)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

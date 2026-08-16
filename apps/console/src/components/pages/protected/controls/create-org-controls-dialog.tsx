'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQueryClient } from '@tanstack/react-query'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { DocsSourceLink } from '@/components/shared/docs-help/suggestion-card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { LightbulbIcon, Link2, PencilLine, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { PlaceholderTextarea } from '@/components/shared/placeholder-textarea/placeholder-textarea'
import { Loader2 } from 'lucide-react'
import { docsHelpEnabled } from '@repo/dally/ai'
import { ControlControlSource, ControlControlStatus, MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { useCreateControl, useGetAllControls, useGetControlMinifiedById, useTemplateControlsWithMappings } from '@/lib/graphql-hooks/control'
import { TEMPLATE_CONTROLS_WHERE } from '@/constants/standards'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { useDocsControlTitles, type DocsControlTitleInput } from '@/hooks/useDocsHelp'
import { SIMILARITY_THRESHOLD, isWeakTitle, templateControlRows, textSimilarity, type TExampleRow, type TExistingMatch, type TTemplateControl } from '@/lib/docs-help/example-controls'
import { useDocsHelpDrawer } from '@/components/shared/docs-help/docs-help-context'
import { hasPlaceholderText } from '@/components/shared/plate/plate-utils'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export type TCreateOrgControlsTarget = {
  id: string
  refCode: string
  referenceFramework?: string | null
}

// deleted suggestions stay deleted: keyed per framework control, scoped to the
// organization, and broadcast so the trigger button and the open dialog stay in step
const dismissedKey = (frameworkControlId: string) => `suggested-controls-dismissed:${frameworkControlId}`
const DISMISSED_EVENT = 'suggested-controls-dismissed'

function readDismissed(frameworkControlId?: string, organizationId?: string): string[] {
  if (!frameworkControlId) return []
  try {
    const stored = getOrganizationStorageItem(dismissedKey(frameworkControlId), organizationId)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}

function dismissSuggestion(frameworkControlId: string, refCode: string, organizationId?: string) {
  const next = [...new Set([...readDismissed(frameworkControlId, organizationId), refCode.trim().toLowerCase()])]
  setOrganizationStorageItem(dismissedKey(frameworkControlId), JSON.stringify(next), organizationId)
  window.dispatchEvent(new CustomEvent(DISMISSED_EVENT))
}

function useDismissedSuggestions(frameworkControlId?: string): string[] {
  const { currentOrgId } = useOrganization()
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed(frameworkControlId, currentOrgId))

  useEffect(() => {
    const sync = () => setDismissed(readDismissed(frameworkControlId, currentOrgId))
    sync()
    window.addEventListener(DISMISSED_EVENT, sync)
    return () => window.removeEventListener(DISMISSED_EVENT, sync)
  }, [frameworkControlId, currentOrgId])

  return dismissed
}

// OL Baseline template controls, fetched once for the page. Each carries the
// framework controls it maps to, so a control looks its suggestions up by ref
// code rather than needing the system control's id
function useTemplateIndex(enabled: boolean) {
  const { controls } = useTemplateControlsWithMappings({ where: TEMPLATE_CONTROLS_WHERE, enabled })

  return useMemo(() => {
    const index = new Map<string, TTemplateControl[]>()

    for (const control of controls) {
      if (!control.refCode) continue
      const template: TTemplateControl = { refCode: control.refCode, name: control.category, description: control.description }

      for (const related of control.relatedControls ?? []) {
        if (!related?.refCode) continue
        const key = related.refCode.trim().toLowerCase()
        index.set(key, [...(index.get(key) ?? []), template])
      }
    }

    return index
  }, [controls])
}

function useResolvedSuggestions(frameworkControl: TCreateOrgControlsTarget | null, existingRefCodes: string[] | undefined, enabled: boolean) {
  const dismissed = useDismissedSuggestions(frameworkControl?.id)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const organizationName = getOrganizationByID(currentOrgId ?? '')?.node?.displayName

  const templateIndex = useTemplateIndex(enabled && docsHelpEnabled)
  const templates = useMemo(() => templateIndex.get(frameworkControl?.refCode.trim().toLowerCase() ?? '') ?? [], [templateIndex, frameworkControl])

  // existing org controls, to offer mapping instead of creating a duplicate
  const { data: orgControlsData } = useGetAllControls({
    where: { referenceFrameworkIsNil: true, systemOwned: false, isTrustCenterControl: false },
    enabled: enabled && docsHelpEnabled,
    includeVars: { includeDescription: true },
  })

  const existingKey = (existingRefCodes ?? []).join('|')

  const orgControls: TExistingMatch[] = useMemo(
    () =>
      (orgControlsData?.controls?.edges ?? []).flatMap((edge) => (edge?.node?.id && edge.node.refCode ? [{ id: edge.node.id, refCode: edge.node.refCode, description: edge.node.description }] : [])),
    [orgControlsData],
  )

  const rows = useMemo(() => resolveSuggestions(templates, existingKey, orgControls, dismissed, organizationName), [templates, existingKey, orgControls, dismissed, organizationName])

  return { rows, isLoading: false }
}

// rows are identified by the template they came from, so editing a ref code
// does not detach a row from its suggestion
const rowKey = (row: TExampleRow) => row.templateRefCode ?? row.refCode

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
  const { rows } = useResolvedSuggestions(frameworkControl, existingRefCodes, true)

  if (!docsHelpEnabled || rows.length === 0) return null
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
    <button type="button" onClick={onClick} aria-label={label} title={label} className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive">
      <Trash2 size={14} />
    </button>
  )
}

type TCreateOrgControlsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  frameworkControl: TCreateOrgControlsTarget | null
  existingRefCodes?: string[]
  onCreated?: (ids: string[]) => void
}

export function CreateOrgControlsDialog({ open, onOpenChange, frameworkControl, existingRefCodes, onCreated }: TCreateOrgControlsDialogProps) {
  const { rows: resolvedRows, isLoading } = useResolvedSuggestions(frameworkControl, existingRefCodes, open)

  const { data: frameworkControlData } = useGetControlMinifiedById(frameworkControl?.id, open)
  const frameworkDescription = frameworkControlData?.control?.description

  const [rows, setRows] = useState<TExampleRow[]>([])
  const [isCreating, setIsCreating] = useState(false)
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

  // rows the template left unnamed are titled automatically; the user can also
  // ask for one on any row, which is snapshotted so typing does not refetch
  const [requestedTitles, setRequestedTitles] = useState<DocsControlTitleInput[]>([])
  // only the rows that were asked show as working, though the batch covers more
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

  const { data: suggestedTitles } = useDocsControlTitles(titleTargets, open && docsHelpEnabled)

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
    if (!open) writtenTitlesRef.current = {}
  }, [open])

  const updateRow = (index: number, patch: Partial<TExampleRow>) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const removeRow = (index: number) => {
    const removed = rows[index]
    if (removed && frameworkControl) dismissSuggestion(frameworkControl.id, rowKey(removed), currentOrgId)
    setRows((current) => current.filter((_, i) => i !== index))
  }

  const { open: docsDrawerOpen, setOpen: setDocsDrawerOpen } = useDocsHelpDrawer()
  const included = rows.filter((row) => row.refCode.trim())

  const handleCreate = async () => {
    if (!frameworkControl || included.length === 0) return
    setIsCreating(true)
    try {
      const newIds: string[] = []
      const existingIds: string[] = []
      for (const row of included) {
        if (row.existingMatch) {
          existingIds.push(row.existingMatch.id)
          continue
        }
        const result = await createControl({
          input: {
            refCode: row.refCode.trim(),
            title: row.title.trim() || undefined,
            description: row.description.trim() || undefined,
            status: ControlControlStatus.DRAFT,
            source: ControlControlSource.TEMPLATE,
          },
        })
        const id = result.createControl.control.id
        if (id) newIds.push(id)
      }

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

      const parts = [newIds.length > 0 ? `Created ${newIds.length} draft control${newIds.length === 1 ? '' : 's'}` : '', existingIds.length > 0 ? `mapped ${existingIds.length} existing` : '']
        .filter(Boolean)
        .join(', ')
      successNotification({
        title: parts || 'Mapped controls',
        description: `Mapped to ${frameworkControl.refCode}`,
      })
      onCreated?.(newIds)
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['controls', 'report'] })
    } catch (error) {
      errorNotification({ title: 'Failed to create controls', description: parseErrorMessage(error) })
    } finally {
      setIsCreating(false)
    }
  }

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
            <p className="mt-1 text-sm text-muted-foreground">{frameworkDescription}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            Loading examples from the docs…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            The docs have no example organization controls for {frameworkControl?.referenceFramework} {frameworkControl?.refCode}.
          </p>
        ) : (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
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
            {rows.map((row, index) => (
              <div key={index} className={`rounded-md border p-3 space-y-2 ${!row.existingMatch && hasPlaceholderText(row.description) ? 'border-[var(--color-warning)]/50' : 'border-border'}`}>
                {row.existingMatch ? (
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link2 size={14} className="text-[var(--color-info)]" />
                        <span className="text-sm font-medium">Map existing {row.existingMatch.refCode}</span>
                        <span className="text-xs text-muted-foreground">covers &ldquo;{row.refCode}&rdquo; — no new control created</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{row.description}</p>
                    </div>
                    <RemoveRowButton onClick={() => removeRow(index)} label={`Remove ${row.existingMatch.refCode}`} />
                  </div>
                ) : (
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || included.length === 0} icon={isCreating ? <Loader2 className="animate-spin" /> : undefined} iconPosition="left">
            {(() => {
              const toCreate = included.filter((row) => !row.existingMatch).length
              const toMap = included.length - toCreate
              if (toCreate > 0 && toMap > 0) return `Create ${toCreate} + map ${toMap}`
              if (toMap > 0) return `Map ${toMap} existing control${toMap === 1 ? '' : 's'}`
              return `Create ${toCreate || ''} draft control${toCreate === 1 ? '' : 's'}`
            })()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

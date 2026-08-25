'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { GitBranch, Link2, Loader2, PanelRightClose, PencilLine } from 'lucide-react'
import { docsHelpAvailable } from '@repo/dally/ai'
import { ControlControlSource, MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import {
  CreateOrgControlsRowsList,
  createOrgControlsSubmitLabel,
  rowKey,
  useCreateOrgControlsRows,
  useResolvedSuggestions,
  type TCreateOrgControlsTarget,
  type TControlSuggestionGroup,
} from '@/components/pages/protected/controls/create-org-controls-dialog'
import { dismissItem } from '@/hooks/useDismissedItems'
import { useOrganization } from '@/hooks/useOrganization'
import { useSuggestedPolicies, type TSuggestedPoliciesData } from '@/components/pages/protected/controls/suggested-policies'
import { type TDocsEvidenceControl } from '@/components/pages/protected/controls/example-evidence-requests'
import { type TExampleRow } from '@/lib/docs-help/example-controls'
import { usePolicyTemplates } from '@/components/pages/protected/policies/suggested-policy-coverage'
import { CreatePolicyMenuItems, findPolicyTemplate, useCreatePolicyFromTemplate } from '@/components/pages/protected/policies/create-policy-actions'
import { coverageNote, normalizeName } from '@/lib/docs-help/names'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { SuggestionCard, TargetChecklist } from '@/components/shared/docs-help/suggestion-card'
import { TruncatedCell } from '@repo/ui/data-table'

export type TGapControl = TCreateOrgControlsTarget & { referenceFramework: string }

type TPolicyGroup = { name: string; description: string; existingPolicy?: { id: string; name: string; summary?: string | null }; controls: TGapControl[] }

function ControlSuggestionWorker({ target, onResult }: { target: TCreateOrgControlsTarget; onResult: (id: string, rows: TExampleRow[], isLoading: boolean, isError: boolean) => void }) {
  const { rows, isLoading, isError } = useResolvedSuggestions(target, undefined, true)
  useEffect(() => onResult(target.id, rows, isLoading, isError), [target.id, rows, isLoading, isError, onResult])
  return null
}

function PolicySuggestionWorker({ control, onResult }: { control: TDocsEvidenceControl; onResult: (id: string, data: TSuggestedPoliciesData | null, isLoading: boolean, isError: boolean) => void }) {
  const { data, isLoading, isError } = useSuggestedPolicies(control)
  useEffect(() => onResult(control.controlId, data, isLoading, isError), [control.controlId, data, isLoading, isError, onResult])
  return null
}

function useAggregated<T>() {
  const [byId, setById] = useState<Record<string, T>>({})
  const set = useCallback((id: string, value: T) => setById((prev) => (prev[id] === value ? prev : { ...prev, [id]: value })), [])
  return [byId, set] as const
}

const dismissedControlKey = (target: TCreateOrgControlsTarget) => `suggested-controls-dismissed:${target.id}:${target.referenceFramework ?? ''}`

// controls stagger in as each one's docs lookup resolves, after the row has
// already mounted, so newly-arrived ones default to checked like the rest
function useStaggeredSelection(controls: TGapControl[]) {
  const [selected, setSelected] = useState(() => new Set(controls.map((c) => c.id)))

  useEffect(() => {
    setSelected((current) => {
      const unseen = controls.map((c) => c.id).filter((id) => !current.has(id))
      return unseen.length === 0 ? current : new Set([...current, ...unseen])
    })
  }, [controls])

  const toggle = (id: string) => setSelected((current) => (current.has(id) ? new Set([...current].filter((c) => c !== id)) : new Set([...current, id])))
  return { selected, toggle }
}

type TGapRowProps = {
  icon: ReactNode
  title: ReactNode
  description?: string | null
  controls: TGapControl[]
  selected: Set<string>
  onToggle: (id: string) => void
  onRemove: () => void
  action: ReactNode
  footer?: ReactNode
}

function MapButton({ busy, selected, total, icon, onClick }: { busy: boolean; selected: Set<string>; total: number; icon: ReactNode; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="primary"
      className="h-8 whitespace-nowrap px-3"
      disabled={busy || selected.size === 0}
      icon={busy ? <Loader2 size={14} className="animate-spin" /> : icon}
      iconPosition="left"
      onClick={onClick}
    >
      Map {selected.size > 0 && selected.size < total ? `(${selected.size})` : ''}
    </Button>
  )
}

function GapRow({ icon, title, description, controls, selected, onToggle, onRemove, action, footer }: TGapRowProps) {
  return (
    <div className="rounded-md border border-border p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <TruncatedCell className="mt-1 text-xs text-muted-foreground" lineClamp={3}>
            {description}
          </TruncatedCell>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="secondary" className="h-8 whitespace-nowrap px-3" onClick={onRemove}>
            Dismiss
          </Button>
          {action}
        </div>
      </div>
      <TargetChecklist targets={controls} isSelected={(control) => selected.has(control.id)} onToggle={(control) => onToggle(control.id)} />
      {footer}
    </div>
  )
}

function MapControlRow({ group, onRemove, onMapped }: { group: TControlSuggestionGroup; onRemove: () => void; onMapped: () => void }) {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createMappedControl } = useCreateMappedControl()
  const { selected, toggle } = useStaggeredSelection(group.controls as TGapControl[])
  const [busy, setBusy] = useState(false)
  const existingMatch = group.row.existingMatch

  if (!existingMatch) return null

  const handleMap = async () => {
    if (selected.size === 0) return
    setBusy(true)
    try {
      await createMappedControl({
        input: {
          fromControlIDs: [...selected],
          toControlIDs: [existingMatch.id],
          mappingType: MappedControlMappingType.PARTIAL,
          source: MappedControlMappingSource.MANUAL,
          confidence: 100,
          relation: `Resolved from gap panel for ${group.controls.map((c) => c.refCode).join(', ')}`,
        },
      })
      successNotification({ title: 'Control mapped', description: `${existingMatch.refCode} applied to ${selected.size} control${selected.size === 1 ? '' : 's'}` })
      onMapped()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <GapRow
      icon={<Link2 size={14} className="text-muted-foreground shrink-0" />}
      title={`Map existing ${existingMatch.refCode}`}
      description={group.row.description}
      controls={group.controls as TGapControl[]}
      selected={selected}
      onToggle={toggle}
      onRemove={onRemove}
      action={<MapButton busy={busy} selected={selected} total={group.controls.length} icon={<GitBranch size={14} />} onClick={handleMap} />}
    />
  )
}

function PolicyMapRow({ group, onRemove, onMapped }: { group: TPolicyGroup; onRemove: () => void; onMapped: () => void }) {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { selected, toggle } = useStaggeredSelection(group.controls)
  const [busy, setBusy] = useState(false)
  const { existingPolicy } = group

  if (!existingPolicy) return null

  const handleMap = async () => {
    if (selected.size === 0) return
    setBusy(true)
    try {
      await updatePolicy({ updateInternalPolicyId: existingPolicy.id, input: { addControlIDs: [...selected] } })
      successNotification({ title: 'Policy mapped', description: `${existingPolicy.name} applied to ${selected.size} control${selected.size === 1 ? '' : 's'}` })
      onMapped()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <GapRow
      icon={<Link2 size={14} className="text-muted-foreground shrink-0" />}
      title={
        <>
          {existingPolicy.name}
          {coverageNote(existingPolicy.name, group.name) && <span className="ml-2 text-xs font-normal text-muted-foreground">{coverageNote(existingPolicy.name, group.name)}</span>}
        </>
      }
      // use the policy summary over the docs description
      description={existingPolicy.summary || group.description}
      controls={group.controls}
      selected={selected}
      onToggle={toggle}
      onRemove={onRemove}
      action={<MapButton busy={busy} selected={selected} total={group.controls.length} icon={<Link2 size={14} />} onClick={handleMap} />}
    />
  )
}

function PolicyCreateRow({ group, onRemove }: { group: TPolicyGroup; onRemove: () => void }) {
  const { data: templates } = usePolicyTemplates(docsHelpAvailable)
  const { selected, toggle } = useStaggeredSelection(group.controls)
  const { createFromTemplate, creatingTemplate } = useCreatePolicyFromTemplate([...selected])
  const template = findPolicyTemplate(templates, group.name)

  return (
    <GapRow
      icon={<PencilLine size={14} className="text-muted-foreground shrink-0" />}
      title={group.name}
      description={group.description}
      controls={group.controls}
      selected={selected}
      onToggle={toggle}
      onRemove={onRemove}
      action={
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="primary" className="h-8 whitespace-nowrap px-3" disabled={selected.size === 0} icon={<PencilLine size={14} />} iconPosition="left">
              Create &amp; map
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <CreatePolicyMenuItems policyName={group.name} template={template} mapControlId={[...selected]} onCreateFromTemplate={createFromTemplate} />
          </DropdownMenuContent>
        </DropdownMenu>
      }
      footer={creatingTemplate && <p className="text-xs text-muted-foreground">Creating from {creatingTemplate}…</p>}
    />
  )
}

const EMPTY_GAP_CONTROLS: TGapControl[] = []

export function useSectionGapGroups(orgGapControls: TGapControl[] = EMPTY_GAP_CONTROLS, policyGapControls: TGapControl[] = EMPTY_GAP_CONTROLS) {
  const { currentOrgId } = useOrganization()
  const [controlRows, setControlRow] = useAggregated<TExampleRow[]>()
  const [controlLoading, setControlLoading] = useAggregated<boolean>()
  const [controlError, setControlError] = useAggregated<boolean>()
  const [policyData, setPolicyDatum] = useAggregated<TSuggestedPoliciesData | null>()
  const [policyLoading, setPolicyLoading] = useAggregated<boolean>()
  const [policyError, setPolicyError] = useAggregated<boolean>()

  const [removedControlKeys, setRemovedControlKeys] = useState<Set<string>>(() => new Set())
  const [removedPolicyKeys, setRemovedPolicyKeys] = useState<Set<string>>(() => new Set())

  const onControlResult = useCallback(
    (id: string, rows: TExampleRow[], isLoading: boolean, isError: boolean) => {
      setControlRow(id, rows)
      setControlLoading(id, isLoading)
      setControlError(id, isError)
    },
    [setControlRow, setControlLoading, setControlError],
  )
  const onPolicyResult = useCallback(
    (id: string, data: TSuggestedPoliciesData | null, isLoading: boolean, isError: boolean) => {
      setPolicyDatum(id, data)
      setPolicyLoading(id, isLoading)
      setPolicyError(id, isError)
    },
    [setPolicyDatum, setPolicyLoading, setPolicyError],
  )

  const controlGroups = useMemo(() => {
    const groups = new Map<string, TControlSuggestionGroup>()
    for (const control of orgGapControls) {
      for (const row of controlRows[control.id] ?? []) {
        const key = rowKey(row)
        const existing = groups.get(key)
        if (existing) existing.controls.push(control)
        else groups.set(key, { row, controls: [control] })
      }
    }
    return Array.from(groups.values()).filter((g) => !removedControlKeys.has(rowKey(g.row)))
  }, [controlRows, orgGapControls, removedControlKeys])

  const mapControlGroups = useMemo(() => controlGroups.filter((g) => g.row.existingMatch), [controlGroups])
  const createControlGroups = useMemo(() => controlGroups.filter((g) => !g.row.existingMatch), [controlGroups])

  const policyGroups = useMemo(() => {
    const groups = new Map<string, TPolicyGroup>()
    for (const control of policyGapControls) {
      for (const suggestion of policyData[control.id]?.suggestions ?? []) {
        const key = normalizeName(suggestion.existingPolicy?.name ?? suggestion.name)
        const existing = groups.get(key)
        if (existing) existing.controls.push(control)
        else groups.set(key, { name: suggestion.name, description: suggestion.description, existingPolicy: suggestion.existingPolicy, controls: [control] })
      }
    }
    return Array.from(groups.values()).filter((g) => !removedPolicyKeys.has(normalizeName(g.existingPolicy?.name ?? g.name)))
  }, [policyData, policyGapControls, removedPolicyKeys])

  const mapPolicyGroups = useMemo(() => policyGroups.filter((g) => g.existingPolicy), [policyGroups])
  const createPolicyGroups = useMemo(() => policyGroups.filter((g) => !g.existingPolicy), [policyGroups])

  const removeControlGroup = (group: TControlSuggestionGroup) => {
    group.controls.forEach((control) => dismissItem(dismissedControlKey(control), rowKey(group.row), currentOrgId))
    setRemovedControlKeys((prev) => new Set([...prev, rowKey(group.row)]))
  }
  const resolveControlGroup = (group: TControlSuggestionGroup) => setRemovedControlKeys((prev) => new Set([...prev, rowKey(group.row)]))

  const removePolicyGroup = (group: TPolicyGroup) => {
    const key = normalizeName(group.existingPolicy?.name ?? group.name)
    group.controls.forEach((control) => policyData[control.id]?.dismissOne(group.name))
    setRemovedPolicyKeys((prev) => new Set([...prev, key]))
  }
  const resolvePolicyGroup = (group: TPolicyGroup) => setRemovedPolicyKeys((prev) => new Set([...prev, normalizeName(group.existingPolicy?.name ?? group.name)]))

  const isLoading = orgGapControls.some((c) => controlLoading[c.id] !== false) || policyGapControls.some((c) => policyLoading[c.id] !== false)
  // a suggestion lookup that failed contributes no groups, so a zero count here
  // means "we could not tell", not "nothing to resolve"
  const hasError = orgGapControls.some((c) => controlError[c.id]) || policyGapControls.some((c) => policyError[c.id])
  const totalCount = controlGroups.length + policyGroups.length

  const workers = (
    <>
      {orgGapControls.map((c) => (
        <ControlSuggestionWorker key={c.id} target={c} onResult={onControlResult} />
      ))}
      {policyGapControls.map((c) => (
        <PolicySuggestionWorker
          key={c.id}
          control={{ controlId: c.id, refCode: c.refCode, referenceFramework: c.referenceFramework, source: ControlControlSource.FRAMEWORK }}
          onResult={onPolicyResult}
        />
      ))}
    </>
  )

  return {
    workers,
    mapControlGroups,
    createControlGroups,
    mapPolicyGroups,
    createPolicyGroups,
    isLoading,
    hasError,
    totalCount,
    removeControlGroup,
    resolveControlGroup,
    removePolicyGroup,
    resolvePolicyGroup,
  }
}

type ResolveGapsPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: string
  gaps: ReturnType<typeof useSectionGapGroups>
}

export function ResolveGapsPanel({ open, onOpenChange, category, gaps }: ResolveGapsPanelProps) {
  const {
    mapControlGroups,
    createControlGroups,
    mapPolicyGroups,
    createPolicyGroups,
    isLoading,
    totalCount: gapCount,
    removeControlGroup,
    resolveControlGroup,
    removePolicyGroup,
    resolvePolicyGroup,
  } = gaps
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const setSectionExpanded = (key: string) => (value: boolean) => setExpandedSections((prev) => ({ ...prev, [key]: value }))

  // the report is expensive to refetch, so resolving is tracked here and pulled once on close
  const queryClient = useQueryClient()
  const resolvedAnythingRef = useRef(false)
  const handleOpenChange = (next: boolean) => {
    if (!next && resolvedAnythingRef.current) {
      resolvedAnythingRef.current = false
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    }
    onOpenChange(next)
  }
  function markResolved<T>(resolve: (group: T) => void, group: T) {
    resolvedAnythingRef.current = true
    resolve(group)
  }

  const visibleSectionCount = [mapControlGroups, createControlGroups, mapPolicyGroups, createPolicyGroups].filter((g) => g.length > 0).length
  const isExpanded = (key: string) => expandedSections[key] ?? visibleSectionCount <= 1

  const createReview = useCreateOrgControlsRows({
    active: open && isExpanded('create-controls'),
    onOpenChange: setSectionExpanded('create-controls'),
    onCreated: (_ids, only) => {
      const resolved = only ? createControlGroups.filter((group) => rowKey(group.row) === rowKey(only)) : createControlGroups
      resolved.forEach((group) => markResolved(resolveControlGroup, group))
    },
    groups: createControlGroups,
  })

  const { mutateAsync: createMappedControl } = useCreateMappedControl()
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { successNotification, errorNotification } = useNotification()
  const [bulkRunning, setBulkRunning] = useState<string | null>(null)

  async function mapAll<T>({ key, groups, resolve, request, title }: { key: string; groups: T[]; resolve: (group: T) => void; request: (group: T) => Promise<unknown>[]; title: string }) {
    setBulkRunning(key)
    try {
      await Promise.all(groups.flatMap(request))
      successNotification({ title })
      groups.forEach((group) => markResolved(resolve, group))
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setBulkRunning(null)
    }
  }

  const handleMapAllControls = () =>
    mapAll({
      key: 'map-controls',
      groups: mapControlGroups,
      resolve: resolveControlGroup,
      title: `Mapped ${mapControlGroups.length} control${mapControlGroups.length === 1 ? '' : 's'}`,
      request: (group) => {
        const toId = group.row.existingMatch?.id
        if (!toId) return []
        return [
          createMappedControl({
            input: {
              fromControlIDs: group.controls.map((c) => c.id),
              toControlIDs: [toId],
              mappingType: MappedControlMappingType.PARTIAL,
              source: MappedControlMappingSource.MANUAL,
              confidence: 100,
              relation: `Resolved from gap panel for ${group.controls.map((c) => c.refCode).join(', ')}`,
            },
          }),
        ]
      },
    })

  const handleMapAllPolicies = () =>
    mapAll({
      key: 'map-policies',
      groups: mapPolicyGroups,
      resolve: resolvePolicyGroup,
      title: `Mapped ${mapPolicyGroups.length} polic${mapPolicyGroups.length === 1 ? 'y' : 'ies'}`,
      request: (group) => (group.existingPolicy ? [updatePolicy({ updateInternalPolicyId: group.existingPolicy.id, input: { addControlIDs: group.controls.map((c) => c.id) } })] : []),
    })

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          initialWidth={1040}
          minWidth={600}
          resizable
          header={
            <SheetHeader>
              <div className="flex items-center justify-between pb-1">
                <PanelRightClose aria-label="Close" size={16} className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleOpenChange(false)} />
              </div>
              <SheetTitle className="text-xl font-medium">Resolve Gaps for {category || 'General'}</SheetTitle>
              {gapCount > 0 && (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category || 'This section'} has{' '}
                    {[
                      mapControlGroups.length + createControlGroups.length > 0 && 'controls without organization coverage',
                      mapPolicyGroups.length + createPolicyGroups.length > 0 && 'controls without a linked policy',
                    ]
                      .filter(Boolean)
                      .join(' and ')}
                    . Review and resolve them below.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {(
                      [
                        { count: mapControlGroups.length, label: 'controls to map' },
                        { count: createControlGroups.length, label: 'controls to create' },
                        { count: mapPolicyGroups.length, label: 'policies to map' },
                        { count: createPolicyGroups.length, label: 'policies to create' },
                      ] as const
                    )
                      .filter((stat) => stat.count > 0)
                      .map((stat) => (
                        <CountBadge key={stat.label} count={stat.count} label={stat.label} />
                      ))}
                  </div>
                </>
              )}
            </SheetHeader>
          }
        >
          {open && (
            <>
              <div className="flex flex-col gap-4">
                {gapCount === 0 && isLoading ? (
                  <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin" />
                    Checking for suggestions…
                  </div>
                ) : gapCount === 0 ? (
                  <p className="py-6 text-sm text-muted-foreground">No gaps left to resolve in this section.</p>
                ) : (
                  <>
                    {mapControlGroups.length > 0 && (
                      <SuggestionCard
                        title="Map controls"
                        icon={<Link2 size={16} className="text-muted-foreground" />}
                        count={mapControlGroups.length}
                        open={isExpanded('map-controls')}
                        onOpenChange={setSectionExpanded('map-controls')}
                        actions={
                          isExpanded('map-controls') && (
                            <Button type="button" variant="secondary" className="h-7 px-2.5 text-xs" disabled={bulkRunning === 'map-controls'} onClick={handleMapAllControls}>
                              {bulkRunning === 'map-controls' ? <Loader2 size={14} className="animate-spin" /> : 'Map all'}
                            </Button>
                          )
                        }
                      >
                        <div className="mt-3 space-y-2">
                          {mapControlGroups.map((group) => (
                            <MapControlRow key={rowKey(group.row)} group={group} onRemove={() => removeControlGroup(group)} onMapped={() => markResolved(resolveControlGroup, group)} />
                          ))}
                        </div>
                      </SuggestionCard>
                    )}

                    {createControlGroups.length > 0 && (
                      <SuggestionCard
                        title="Create controls"
                        icon={<PencilLine size={16} className="text-muted-foreground" />}
                        count={createControlGroups.length}
                        open={isExpanded('create-controls')}
                        onOpenChange={setSectionExpanded('create-controls')}
                      >
                        <div className="mt-3 space-y-3">
                          <CreateOrgControlsRowsList
                            rows={createReview.rows}
                            isLoading={createReview.isLoading}
                            emptyMessage="Nothing left to review."
                            updateRow={createReview.updateRow}
                            removeRow={createReview.removeRow}
                            requestTitle={createReview.requestTitle}
                            pendingTitleKeys={createReview.pendingTitleKeys}
                            targetsByRow={createReview.targetsByRow}
                            isTargetSelected={(row, target) => createReview.selectedTargets(row).some((t) => t.id === target.id)}
                            onToggleTarget={createReview.toggleTarget}
                            onCreateRow={(row) => createReview.handleCreate(row)}
                            creatingRowKeys={createReview.creatingRowKeys}
                          />
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              disabled={createReview.isCreating || createReview.included.length === 0}
                              icon={createReview.isCreating ? <Loader2 size={14} className="animate-spin" /> : undefined}
                              iconPosition="left"
                              onClick={() => createReview.handleCreate()}
                            >
                              {createOrgControlsSubmitLabel(createReview.included)}
                            </Button>
                          </div>
                        </div>
                      </SuggestionCard>
                    )}

                    {mapPolicyGroups.length > 0 && (
                      <SuggestionCard
                        title="Map policies"
                        icon={<Link2 size={16} className="text-muted-foreground" />}
                        count={mapPolicyGroups.length}
                        open={isExpanded('map-policies')}
                        onOpenChange={setSectionExpanded('map-policies')}
                        actions={
                          isExpanded('map-policies') && (
                            <Button type="button" variant="secondary" className="h-7 px-2.5 text-xs" disabled={bulkRunning === 'map-policies'} onClick={handleMapAllPolicies}>
                              {bulkRunning === 'map-policies' ? <Loader2 size={14} className="animate-spin" /> : 'Map all'}
                            </Button>
                          )
                        }
                      >
                        <div className="mt-3 space-y-2">
                          {mapPolicyGroups.map((group) => (
                            <PolicyMapRow
                              key={normalizeName(group.existingPolicy?.name ?? group.name)}
                              group={group}
                              onRemove={() => removePolicyGroup(group)}
                              onMapped={() => markResolved(resolvePolicyGroup, group)}
                            />
                          ))}
                        </div>
                      </SuggestionCard>
                    )}

                    {createPolicyGroups.length > 0 && (
                      <SuggestionCard
                        title="Create policies"
                        icon={<PencilLine size={16} className="text-muted-foreground" />}
                        count={createPolicyGroups.length}
                        open={isExpanded('create-policies')}
                        onOpenChange={setSectionExpanded('create-policies')}
                      >
                        <div className="mt-3 space-y-2">
                          {createPolicyGroups.map((group) => (
                            <PolicyCreateRow key={normalizeName(group.name)} group={group} onRemove={() => removePolicyGroup(group)} />
                          ))}
                        </div>
                      </SuggestionCard>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

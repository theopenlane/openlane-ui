'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useOrganization } from '@/hooks/useOrganization'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { type ControlGroupItem, useGetControlById, useGetControlsGroupedByCategoryResolver, useBulkEditControl, useBulkEditSubcontrol, useSubcontrolIdFetcher } from '@/lib/graphql-hooks/control'
import {
  useOrgCoverageMap,
  useOrgCoverageForSubcontrol,
  useFrameworkCoverageMap,
  useFrameworkCoverageForSubcontrol,
  type FrameworkCoverageData,
  EVIDENCE_SEVERITY_ORDER,
} from '@/lib/graphql-hooks/mapped-control'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ControlControlStatus, EvidenceEvidenceStatus, type ControlWhereInput, SubcontrolControlStatus } from '@repo/codegen/src/schema'
import { ChevronDown, ChevronRight, ChevronsUpDown, ListChecks, SlidersHorizontal, SquarePlus, Upload, TriangleAlert, UserCog, Tag, X, FileSearch } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import Link from 'next/link'
import { Button } from '@repo/ui/button'

import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { ControlReportPageSkeleton } from './skeleton/control-report-page-skeleton'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import Menu from '@/components/shared/menu/menu'
import { BulkCSVCloneControlDialog } from '../controls/bulk-csv-clone-control-dialog'
import { BulkCSVCreateControlDialog } from '../controls/bulk-csv-create-control-dialog'
import { BulkCSVCreateMappedControlDialog } from '../controls/bulk-csv-create-map-control-dialog'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { Callout } from '@/components/shared/callout/callout'
import { ControlsEmptyActions } from './control-empty'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import TabSwitcher from '@/components/shared/tab-switcher/tab-switcher.tsx'
import { TabSwitcherStorageKeys } from '@/components/shared/tab-switcher/tab-switcher-storage-keys.ts'
import OrgCoverageCell, { type OrgCoverageData } from './org-coverage-cell'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import ControlChip from '../controls/map-controls/shared/control-chip'
import { type MapControl } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { toBase64DataUri } from '@/lib/image-utils'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Checkbox } from '@repo/ui/checkbox'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { ControlStatusOptions, CONTROL_STATUS_STYLES } from '@/components/shared/enum-mapper/control-enum'
import { EVIDENCE_STATUS_STYLES } from '@/components/shared/enum-mapper/evidence-enum'
import { useNotification } from '@/hooks/useNotification'
import { TruncatedCell } from '@repo/ui/data-table'

type TControlReportPageProps = {
  active: 'dashboard' | 'table'
  setActive: (tab: 'dashboard' | 'table') => void
}

// Grid column template shared across header, control rows, and subcontrol rows
// Columns: [checkbox] chevron | ref (+ status below) | description | owner | org-coverage (framework only) | evidence | policies | controls
const getGridCols = (isCustomView: boolean, isSelectionMode: boolean) => `${isSelectionMode ? '20px ' : ''}16px 110px minmax(180px, 1fr) 140px ${!isCustomView ? '160px ' : ''}140px 160px 160px`

const EVIDENCE_TOOLTIP_MAX = 5

type ReportFilterOption = {
  id: string
  label: string
  // When set, the option only appears for the indicated view mode
  viewRestriction?: 'framework' | 'custom'
}

const REPORT_FILTER_OPTIONS: ReportFilterOption[] = [
  { id: 'NOT_APPROVED', label: 'Not approved' },
  { id: 'NO_OWNER', label: 'No owner' },
  { id: 'NO_EVIDENCE', label: 'No evidence' },
  { id: 'EVIDENCE_NON_APPROVED', label: 'Evidence in non-approved state' },
  { id: 'NO_POLICIES', label: 'No policies linked' },
  { id: 'NO_ORG_CONTROLS', label: 'No org controls linked', viewRestriction: 'framework' },
  { id: 'NO_FRAMEWORK_CONTROLS', label: 'No framework controls linked', viewRestriction: 'custom' },
]

type EvidenceCoverageProps = {
  totalCount: number
  approvedCount?: number
  worstStatus?: EvidenceEvidenceStatus | null
  evidenceRefs?: Array<{ id: string; name: string; status?: string | null; controlId: string }>
  primaryControlId?: string
}

const EvidenceCoverageCell: React.FC<EvidenceCoverageProps> = ({ totalCount, approvedCount = 0, worstStatus, evidenceRefs, primaryControlId }) => {
  if (totalCount === 0) {
    return <span className="text-xs italic text-muted-foreground">No evidence</span>
  }

  const pct = (approvedCount / totalCount) * 100
  const barClass = pct === 100 ? 'coverage-bar-complete' : pct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'
  const statusStyle = worstStatus ? EVIDENCE_STATUS_STYLES[worstStatus] : null
  const sortedRefs = [...(evidenceRefs ?? [])].sort((a, b) => {
    const ai = EVIDENCE_SEVERITY_ORDER.indexOf(a.status as EvidenceEvidenceStatus)
    const bi = EVIDENCE_SEVERITY_ORDER.indexOf(b.status as EvidenceEvidenceStatus)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
  const visibleRefs = sortedRefs.slice(0, EVIDENCE_TOOLTIP_MAX)
  const overflowCount = sortedRefs.length - visibleRefs.length

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-2">
        {statusStyle && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0 cursor-default" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                  {statusStyle.label}
                </span>
              </TooltipTrigger>
              {visibleRefs.length > 0 && (
                <TooltipContent side="top" collisionPadding={64}>
                  <div className="text-xs min-w-[180px] max-w-[280px] space-y-1.5">
                    <p className="font-semibold mb-1">Evidence</p>
                    {visibleRefs.map((ev) => {
                      const style = ev.status ? EVIDENCE_STATUS_STYLES[ev.status as EvidenceEvidenceStatus] : null
                      return (
                        <div key={ev.id} className="flex items-center gap-2">
                          {style ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: style.bg, color: style.color }}>
                              {style.label}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-muted text-muted-foreground">—</span>
                          )}
                          <Link href={`/controls/${ev.controlId}?tab=evidence`} className="truncate hover:underline" target="_blank" rel="noopener noreferrer">
                            {ev.name}
                          </Link>
                        </div>
                      )
                    })}
                    {overflowCount > 0 && primaryControlId && (
                      <Link href={`/controls/${primaryControlId}?tab=evidence`} className="block text-muted-foreground hover:underline pt-1" target="_blank" rel="noopener noreferrer">
                        See all ({overflowCount} more)
                      </Link>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {approvedCount}/{totalCount}
        </span>
      </div>
    </div>
  )
}

// Column header row inside each category table
const ControlTableHeader: React.FC<{
  isCustomView: boolean
  isSelectionMode: boolean
  allIds: string[]
  selectedIds: Set<string>
  onSelectAll: (ids: string[]) => void
}> = ({ isCustomView, isSelectionMode, allIds, selectedIds, onSelectAll }) => {
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id))
  const someSelected = allIds.some((id) => selectedIds.has(id)) && !allSelected
  return (
    <div className="grid gap-x-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b" style={{ gridTemplateColumns: getGridCols(isCustomView, isSelectionMode) }}>
      {isSelectionMode && (
        <div className="flex items-center">
          <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={(v) => onSelectAll(v ? allIds : [])} aria-label="Select all" />
        </div>
      )}
      <div />
      <div>Ref Code</div>
      <div>Description</div>
      <div>Owner</div>
      {!isCustomView && <div>Org coverage</div>}
      <div>Evidence</div>
      <div>Policies</div>
      <div>{isCustomView ? 'Framework controls' : 'Org controls'}</div>
    </div>
  )
}

// Single framework control row
const ControlRow: React.FC<{
  control: ControlGroupItem
  expanded: boolean
  onToggle: () => void
  isCustomView: boolean
  isSelectionMode: boolean
  coverageData?: OrgCoverageData | null
  frameworkData?: FrameworkCoverageData | null
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}> = ({ control, expanded, onToggle, isCustomView, isSelectionMode, coverageData, frameworkData, selected, onSelect }) => {
  const hasSubcontrols = control.subcontrolCount > 0
  const gridCols = getGridCols(isCustomView, isSelectionMode)
  const { convertToReadOnly } = usePlateEditor()

  // Merge own evidence with mapped evidence (org controls in framework view; framework controls in custom view), deduplicated by id
  const ownEvidenceRefs = (control.evidenceRefs ?? []).map((r) => ({ ...r, controlId: control.id }))
  const mappedEvidenceRefs = isCustomView ? [...(frameworkData?.evidenceRefs ?? []), ...(coverageData?.evidenceRefs ?? [])] : (coverageData?.evidenceRefs ?? [])
  const seenEvidenceIds = new Set<string>()
  const allEvidenceRefs = [...ownEvidenceRefs, ...mappedEvidenceRefs].filter((r) => {
    if (seenEvidenceIds.has(r.id)) return false
    seenEvidenceIds.add(r.id)
    return true
  })
  const evidenceTotal = allEvidenceRefs.length
  const evidenceApproved = allEvidenceRefs.filter((r) => r.status === EvidenceEvidenceStatus.AUDITOR_APPROVED).length
  const evidenceWorstStatus = allEvidenceRefs.reduce<EvidenceEvidenceStatus | null>((worst, r) => {
    const s = r.status as EvidenceEvidenceStatus
    if (!s) return worst
    const idx = EVIDENCE_SEVERITY_ORDER.indexOf(s)
    if (idx === -1) return worst
    const worstIdx = worst ? EVIDENCE_SEVERITY_ORDER.indexOf(worst) : EVIDENCE_SEVERITY_ORDER.length
    return idx < worstIdx ? s : worst
  }, null)

  const controlStatusStyle = control.status ? CONTROL_STATUS_STYLES[control.status as ControlControlStatus] : null
  const seenPolicyIds = new Set<string>()
  const linkedPolicies = [...(control.linkedPolicies ?? []), ...(isCustomView ? (frameworkData?.linkedPolicies ?? []) : (coverageData?.linkedPolicies ?? []))].filter((p) => {
    if (seenPolicyIds.has(p.id)) return false
    seenPolicyIds.add(p.id)
    return true
  })

  return (
    <div
      className={`grid gap-x-3 px-3 py-2.5 items-start border-b last:border-b-0 transition-colors ${expanded ? 'bg-background-secondary' : 'hover:bg-muted/30'} ${hasSubcontrols ? 'cursor-pointer' : ''}`}
      style={{ gridTemplateColumns: gridCols }}
      onClick={hasSubcontrols ? onToggle : undefined}
    >
      {/* Checkbox — only visible in selection mode */}
      {isSelectionMode && (
        <div className="flex items-center pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(control.id, !!v)} aria-label="Select row" />
        </div>
      )}

      {/* Expand chevron — only when subcontrols exist */}
      <div className="flex items-center justify-center pt-0.5 h-5">
        {hasSubcontrols && <ChevronRight size={13} className={`text-muted-foreground transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />}
      </div>

      {/* Ref + status */}
      <div onClick={(e) => e.stopPropagation()}>
        <Link href={`/controls/${control.id}`} className="text-brand hover:underline font-medium text-sm whitespace-nowrap">
          {control.refCode}
        </Link>
        {controlStatusStyle && (
          <span className="mt-1 block text-[10px] px-1.5 py-0.5 rounded-full w-fit" style={{ backgroundColor: controlStatusStyle.bg, color: controlStatusStyle.color }}>
            {controlStatusStyle.label}
          </span>
        )}
      </div>

      {/* Description */}
      <TruncatedCell className="text-sm leading-relaxed line-clamp-2 text-foreground">
        {control.description ? convertToReadOnly(control.description, 0) : <span className="italic text-muted-foreground">No description</span>}
      </TruncatedCell>

      {/* Owner */}
      <div className="flex items-center gap-1.5 min-w-0">
        {control.controlOwner ? (
          <>
            <Avatar variant="small">
              {control.controlOwner.avatarFile?.base64 ? (
                <AvatarImage src={toBase64DataUri(control.controlOwner.avatarFile.base64)} />
              ) : control.controlOwner.gravatarLogoURL ? (
                <AvatarImage src={control.controlOwner.gravatarLogoURL} />
              ) : null}
              <AvatarFallback>{control.controlOwner.displayName?.substring(0, 1) ?? '?'}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate">{control.controlOwner.displayName}</span>
          </>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TriangleAlert size={12} className="text-warning shrink-0" />
            No owner
          </span>
        )}
      </div>

      {/* Org coverage — aggregated from MappedControl records */}
      {!isCustomView && (
        <div>
          <OrgCoverageCell data={coverageData ?? null} />
        </div>
      )}

      {/* Evidence coverage — own evidence merged with evidence from mapped controls */}
      <div onClick={(e) => e.stopPropagation()}>
        <EvidenceCoverageCell totalCount={evidenceTotal} approvedCount={evidenceApproved} worstStatus={evidenceWorstStatus} evidenceRefs={allEvidenceRefs} primaryControlId={control.id} />
      </div>

      {/* Linked policies — own policies merged with those from mapped controls (org→framework or framework→org), deduped by id */}
      <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
        {linkedPolicies.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">None linked</span>
        ) : (
          linkedPolicies.map((p) => (
            <Link key={p.id} href={`/policies/${p.id}/view`} target="_blank" rel="noopener noreferrer">
              <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-accent cursor-pointer">{p.name}</span>
            </Link>
          ))
        )}
      </div>

      {isCustomView ? (
        // Framework controls this org control maps to
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {frameworkData?.frameworkControlRefs?.map((ref) => (
            <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode, referenceFramework: ref.framework } as MapControl} hideStandard />
          ))}
        </div>
      ) : (
        // Org controls mapped to this framework control
        <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
          {coverageData?.orgControlRefs?.map((ref) => (
            <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode } as MapControl} hideStandard hideHexagon />
          ))}
        </div>
      )}
    </div>
  )
}

type ControlOwner = { displayName?: string | null; gravatarLogoURL?: string | null; avatarFile?: { base64?: string | null } | null } | null

// Subcontrol row — includes its own coverage via a per-subcontrol hook
const SubcontrolRow: React.FC<{
  sub: { id: string; refCode: string; description?: string | null; status?: string | null; evidenceRefs?: Array<{ id: string; name: string; status?: string | null }> }
  controlId: string
  isCustomView: boolean
  isSelectionMode: boolean
  controlOwner?: ControlOwner
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}> = ({ sub, controlId, isCustomView, isSelectionMode, controlOwner, selected, onSelect }) => {
  const coverageData = useOrgCoverageForSubcontrol(sub.id)
  const frameworkSubData = useFrameworkCoverageForSubcontrol(isCustomView ? sub.id : undefined)
  const gridCols = getGridCols(isCustomView, isSelectionMode)
  const { convertToReadOnly } = usePlateEditor()

  const subStatusStyle = sub.status ? CONTROL_STATUS_STYLES[sub.status as ControlControlStatus] : null

  const ownSubEvidenceRefs = (sub.evidenceRefs ?? []).map((r) => ({ ...r, controlId: `${controlId}/${sub.id}` }))
  const mappedSubEvidenceRefs = coverageData?.evidenceRefs ?? []
  const seenSubEvidenceIds = new Set<string>()
  const allSubEvidenceRefs = [...ownSubEvidenceRefs, ...mappedSubEvidenceRefs].filter((r) => {
    if (seenSubEvidenceIds.has(r.id)) return false
    seenSubEvidenceIds.add(r.id)
    return true
  })
  const subEvidenceApproved = allSubEvidenceRefs.filter((r) => r.status === EvidenceEvidenceStatus.AUDITOR_APPROVED).length
  const subEvidenceWorstStatus = allSubEvidenceRefs.reduce<EvidenceEvidenceStatus | null>((worst, r) => {
    const s = r.status as EvidenceEvidenceStatus
    if (!s) return worst
    const idx = EVIDENCE_SEVERITY_ORDER.indexOf(s)
    if (idx === -1) return worst
    return idx < (worst ? EVIDENCE_SEVERITY_ORDER.indexOf(worst) : EVIDENCE_SEVERITY_ORDER.length) ? s : worst
  }, null)

  const subPolicies = isCustomView ? (frameworkSubData?.linkedPolicies ?? []) : (coverageData?.linkedPolicies ?? [])

  return (
    <div className="grid gap-x-3 px-3 py-1.5 items-start border-t border-border/30" style={{ gridTemplateColumns: gridCols }}>
      {isSelectionMode && (
        <div className="flex items-center pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(sub.id, !!v)} aria-label="Select row" />
        </div>
      )}

      {/* Expand cell: empty — subcontrols are never expandable */}
      <div />

      {/* Ref + status */}
      <div style={{ paddingLeft: 18 }}>
        <Link href={`/controls/${controlId}/${sub.id}`} className="text-brand hover:underline text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          {sub.refCode}
        </Link>
        {subStatusStyle && (
          <span className="mt-1 block text-[10px] px-1.5 py-0.5 rounded-full w-fit" style={{ backgroundColor: subStatusStyle.bg, color: subStatusStyle.color }}>
            {subStatusStyle.label}
          </span>
        )}
      </div>

      {/* Description */}
      <TruncatedCell className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {sub.description ? convertToReadOnly(sub.description, 0) : <span className="italic">No description</span>}
      </TruncatedCell>

      {/* Owner — inherited from parent control */}
      <div className="flex items-center gap-1.5 min-w-0">
        {controlOwner ? (
          <>
            <Avatar variant="small">
              {controlOwner.avatarFile?.base64 ? (
                <AvatarImage src={toBase64DataUri(controlOwner.avatarFile.base64)} />
              ) : controlOwner.gravatarLogoURL ? (
                <AvatarImage src={controlOwner.gravatarLogoURL} />
              ) : null}
              <AvatarFallback>{controlOwner.displayName?.substring(0, 1) ?? '?'}</AvatarFallback>
            </Avatar>
            <span className="text-xs truncate">{controlOwner.displayName}</span>
          </>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TriangleAlert size={12} className="text-warning shrink-0" />
            No owner
          </span>
        )}
      </div>

      {/* Org coverage scoped to this subcontrol */}
      {!isCustomView && (
        <div>
          <OrgCoverageCell data={coverageData} />
        </div>
      )}

      {/* Evidence — own evidence merged with evidence from mapped org controls */}
      <div onClick={(e) => e.stopPropagation()}>
        <EvidenceCoverageCell
          totalCount={allSubEvidenceRefs.length}
          approvedCount={subEvidenceApproved}
          worstStatus={subEvidenceWorstStatus}
          evidenceRefs={allSubEvidenceRefs}
          primaryControlId={`${controlId}/${sub.id}`}
        />
      </div>

      {/* Linked policies — from mapped org controls (framework view) or mapped framework controls (custom view) */}
      <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
        {subPolicies.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">None linked</span>
        ) : (
          subPolicies.map((p) => (
            <Link key={p.id} href={`/policies/${p.id}/view`} target="_blank" rel="noopener noreferrer">
              <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-accent cursor-pointer">{p.name}</span>
            </Link>
          ))
        )}
      </div>

      {/* Org controls (framework view) or framework subcontrols (custom view) */}
      <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {isCustomView
          ? frameworkSubData?.frameworkControlRefs?.map((ref) => (
              <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode, referenceFramework: ref.framework } as MapControl} hideStandard />
            ))
          : coverageData?.orgControlRefs?.map((ref) => <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode } as MapControl} hideStandard hideHexagon />)}
      </div>
    </div>
  )
}

// Expanded subcontrol section — lazily fetches full control data on mount
const SubcontrolRows: React.FC<{
  controlId: string
  isCustomView: boolean
  isSelectionMode: boolean
  selectedSubcontrolIds: Set<string>
  onSelectSubcontrol: (id: string, checked: boolean) => void
  onSelectAllSubcontrols: (ids: string[], checked: boolean) => void
}> = ({ controlId, isCustomView, isSelectionMode, selectedSubcontrolIds, onSelectSubcontrol, onSelectAllSubcontrols }) => {
  const { data, isLoading } = useGetControlById(controlId)

  if (isLoading) {
    return <div className="bg-background-secondary border-b px-3 py-3 text-xs text-muted-foreground animate-pulse">Loading subcontrols…</div>
  }

  const subcontrols = (data?.control?.subcontrols?.edges ?? []).map((e) => e?.node).filter((n): n is NonNullable<typeof n> => n != null)
  if (subcontrols.length === 0) return null

  const controlOwner = data?.control?.controlOwner ?? null
  const subIds = subcontrols.map((s) => s.id)
  const allSelected = subIds.length > 0 && subIds.every((id) => selectedSubcontrolIds.has(id))
  const someSelected = subIds.some((id) => selectedSubcontrolIds.has(id)) && !allSelected

  return (
    <div className="bg-background-secondary border-b">
      <div className="px-3 py-1 flex items-center gap-2">
        {isSelectionMode && (
          <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={(v) => onSelectAllSubcontrols(subIds, !!v)} aria-label="Select all subcontrols" />
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subcontrols</span>
      </div>

      {subcontrols.map((sub) => {
        const evidenceRefs = (sub.evidence?.edges ?? [])
          .map((e) => e?.node)
          .filter((n): n is NonNullable<typeof n> => !!n?.id)
          .map((n) => ({ id: n.id, name: n.name ?? '', status: n.status }))
        return (
          <SubcontrolRow
            key={sub.id}
            sub={{ ...sub, evidenceRefs }}
            controlId={controlId}
            isCustomView={isCustomView}
            isSelectionMode={isSelectionMode}
            controlOwner={controlOwner}
            selected={selectedSubcontrolIds.has(sub.id)}
            onSelect={onSelectSubcontrol}
          />
        )
      })}
    </div>
  )
}

// Report's own filter key — independent of the table's shared filter storage
const REPORT_STANDARD_KEY = 'control_report_selected_standard'

const ControlReportPage: React.FC<TControlReportPageProps> = ({ active, setActive }) => {
  const { currentOrgId } = useOrganization()
  const { setCrumbs } = use(BreadcrumbContext)
  // Initialized synchronously from the report's own localStorage key so the label is correct on first render
  const [selectedStandard, setSelectedStandard] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(REPORT_STANDARD_KEY) ?? ''
  })
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  // Tracks which framework control rows are expanded to show subcontrols
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)
  const [expandedControls, setExpandedControls] = useState<Record<string, boolean>>({})
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [reportFilters, setReportFilters] = useState<Set<string>>(() => new Set())
  const [reportPopoverOpen, setReportPopoverOpen] = useState(false)

  const { data: permission } = useOrganizationRoles()
  const createAllowed = hasPermission(permission?.roles, AccessEnum.CanCreateControl)

  const { standardOptions, isSuccess: isSuccessStandards } = useStandardsSelect({
    where: {
      shortNameNEQ: 'OTS',
      hasControlsWith: [
        {
          hasOwnerWith: [{ id: currentOrgId }],
        },
      ],
    },
    enabled: Boolean(currentOrgId),
  })

  // effectiveStandard: resolves to the first available standard when nothing is saved yet,
  // so the label, where, and query are always in sync without waiting for an effect
  const effectiveStandard = useMemo(() => {
    if (selectedStandard) return selectedStandard
    const neverSet = typeof window !== 'undefined' && localStorage.getItem(REPORT_STANDARD_KEY) === null
    if (neverSet && isSuccessStandards && standardOptions.length > 0) return standardOptions[0].value
    return ''
  }, [selectedStandard, isSuccessStandards, standardOptions])

  // Custom view: CUSTOM selected — inverts columns to show framework controls per org control
  const isCustomView = effectiveStandard === 'CUSTOM'

  const where: ControlWhereInput | undefined = useMemo(() => {
    const base: ControlWhereInput = {
      ownerIDNEQ: '',
      statusNotIn: [ControlControlStatus.ARCHIVED, ControlControlStatus.NOT_APPLICABLE],
    }

    if (!effectiveStandard) return base
    if (effectiveStandard === 'CUSTOM') {
      base.referenceFrameworkIsNil = true
      return base
    }

    base.standardIDIn = [effectiveStandard]
    return base
  }, [effectiveStandard])

  const { data, isLoading, isFetching } = useGetControlsGroupedByCategoryResolver({
    where,
    enabled: Boolean(currentOrgId),
  })

  const sortedData = useMemo(() => {
    if (!data) return data
    const sorted = data.map((entry) => ({
      ...entry,
      controls: [...entry.controls].sort((a, b) => a.refCode.localeCompare(b.refCode, undefined, { numeric: true })),
    }))
    return sorted.sort((a, b) => {
      const minA = a.controls[0]?.refCode ?? ''
      const minB = b.controls[0]?.refCode ?? ''
      return minA.localeCompare(minB, undefined, { numeric: true })
    })
  }, [data])

  const hasNoControls = !sortedData || sortedData.length === 0 || sortedData.every((entry) => entry.controls.length === 0)

  // Collect all framework control IDs from the current view for the batch coverage query
  const allControlIds = useMemo(() => (sortedData ?? []).flatMap((entry) => entry.controls.map((c) => c.id)), [sortedData])
  // [IMPORTANT] Review fix I7: skip the org-coverage request in custom view (ids are org controls there; data is irrelevant)
  const orgCoverageMap = useOrgCoverageMap(isCustomView ? [] : allControlIds)
  const frameworkCoverageMap = useFrameworkCoverageMap(isCustomView ? allControlIds : [])

  // Client-side filter: only show controls matching any active "Report on" criteria
  const filteredSortedData = useMemo(() => {
    if (!sortedData || reportFilters.size === 0) return sortedData

    return sortedData
      .map((entry) => ({
        ...entry,
        controls: entry.controls.filter((control) => {
          const coverageData = orgCoverageMap.get(control.id)
          const frameworkData = frameworkCoverageMap.get(control.id)

          // Combined evidence deduplicated by id — mirrors the logic in ControlRow
          const mappedEvidenceRefs = isCustomView ? [...(frameworkData?.evidenceRefs ?? []), ...(coverageData?.evidenceRefs ?? [])] : (coverageData?.evidenceRefs ?? [])
          const seen = new Set<string>()
          const allEvidenceRefs = [...(control.evidenceRefs ?? []), ...mappedEvidenceRefs].filter((r) => {
            if (seen.has(r.id)) return false
            seen.add(r.id)
            return true
          })
          const evidenceTotal = allEvidenceRefs.length

          const seenPolicies = new Set<string>()
          const policies = [...(control.linkedPolicies ?? []), ...(isCustomView ? (frameworkData?.linkedPolicies ?? []) : (coverageData?.linkedPolicies ?? []))].filter((p) => {
            if (seenPolicies.has(p.id)) return false
            seenPolicies.add(p.id)
            return true
          })

          // A control matches if it satisfies ANY active filter
          for (const filterId of reportFilters) {
            if (filterId === 'NOT_APPROVED' && control.status !== ControlControlStatus.APPROVED) return true
            if (filterId === 'NO_OWNER' && !control.controlOwner) return true
            if (filterId === 'NO_EVIDENCE' && evidenceTotal === 0) return true
            if (filterId === 'EVIDENCE_NON_APPROVED' && evidenceTotal > 0 && allEvidenceRefs.some((r) => r.status !== EvidenceEvidenceStatus.AUDITOR_APPROVED)) return true
            if (filterId === 'NO_POLICIES' && policies.length === 0) return true
            if (filterId === 'NO_ORG_CONTROLS' && !isCustomView && (!coverageData || coverageData.orgControlRefs.length === 0)) return true
            if (filterId === 'NO_FRAMEWORK_CONTROLS' && isCustomView && (!frameworkData || frameworkData.frameworkControlRefs.length === 0)) return true
          }
          return false
        }),
      }))
      .filter((entry) => entry.controls.length > 0)
  }, [sortedData, reportFilters, orgCoverageMap, frameworkCoverageMap, isCustomView])

  // Auto-select first framework on first-ever visit (key not yet written to own storage)
  useEffect(() => {
    if (isSuccessStandards && standardOptions.length > 0 && localStorage.getItem(REPORT_STANDARD_KEY) === null) {
      const first = standardOptions[0].value
      setSelectedStandard(first)
      localStorage.setItem(REPORT_STANDARD_KEY, first)
    }
  }, [isSuccessStandards, standardOptions])

  // Auto-expand all accordion categories on first data load; reset when filter changes
  useEffect(() => {
    if (sortedData && !hasAutoExpanded && sortedData.length > 0) {
      setExpandedItems(sortedData.map((item) => item.category))
      setHasAutoExpanded(true)
    }
  }, [sortedData, hasAutoExpanded])

  useEffect(() => {
    setHasAutoExpanded(false)
  }, [effectiveStandard])

  const [selectedControlIds, setSelectedControlIds] = useState<Set<string>>(() => new Set())
  const [selectedSubcontrolIds, setSelectedSubcontrolIds] = useState<Set<string>>(() => new Set())
  const { mutateAsync: bulkEditControl } = useBulkEditControl()
  const { mutateAsync: bulkEditSubcontrol } = useBulkEditSubcontrol()
  const fetchSubcontrolIds = useSubcontrolIdFetcher()
  const { data: groupsData } = useGetAllGroups({ where: {}, enabled: true })
  const { successNotification, errorNotification } = useNotification()
  const groups = (groupsData?.groups?.edges ?? []).map((e) => e?.node).filter(Boolean)

  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false)
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const [pendingOwnerId, setPendingOwnerId] = useState('')
  const [pendingStatus, setPendingStatus] = useState('')
  const [ownerCascade, setOwnerCascade] = useState({ sub: false, mapped: false })
  const [statusCascade, setStatusCascade] = useState({ sub: false, mapped: false })

  const toggleSelection = useCallback((id: string, checked: boolean) => {
    setSelectedControlIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const toggleSubcontrolSelection = useCallback((id: string, checked: boolean) => {
    setSelectedSubcontrolIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const batchSelectSubcontrols = useCallback((ids: string[], checked: boolean) => {
    setSelectedSubcontrolIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const setSelectionForCategory = useCallback((ids: string[], checked: boolean) => {
    setSelectedControlIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }, [])

  const handleBulkAction = useCallback(
    async (input: { controlOwnerID?: string; status?: ControlControlStatus }, options: { subcontrols: boolean; mappedControls: boolean }) => {
      const ids = [...selectedControlIds]
      const subIds = [...selectedSubcontrolIds]
      if (ids.length === 0 && subIds.length === 0) return
      try {
        if (ids.length > 0) {
          await bulkEditControl({ ids, input })
        }

        const subcontrolInput = {
          ...(input.controlOwnerID ? { controlOwnerID: input.controlOwnerID } : {}),
          // [CRITICAL] Review fix C4: index the target enum by shared value instead of `as unknown as` double-cast
          ...(input.status ? { status: SubcontrolControlStatus[input.status] } : {}),
        }

        let mappedControlIds: string[] = []
        if (options.mappedControls && ids.length > 0) {
          mappedControlIds = isCustomView
            ? [...new Set(ids.flatMap((id) => (frameworkCoverageMap.get(id)?.frameworkControlRefs ?? []).map((r) => r.id)))]
            : [...new Set(ids.flatMap((id) => (orgCoverageMap.get(id)?.orgControlRefs ?? []).map((r) => r.id)))]
          if (mappedControlIds.length > 0) {
            await bulkEditControl({ ids: mappedControlIds, input })
          }
        }

        if (options.subcontrols) {
          const parentIds = [...new Set([...ids, ...mappedControlIds])]
          const cascadeSubIds = parentIds.length > 0 ? await fetchSubcontrolIds(parentIds) : []
          const allSubIds = [...new Set([...cascadeSubIds, ...subIds])]
          if (allSubIds.length > 0) {
            await bulkEditSubcontrol({ ids: allSubIds, input: subcontrolInput })
          }
        } else if (subIds.length > 0) {
          await bulkEditSubcontrol({ ids: subIds, input: subcontrolInput })
        }

        const parts = []
        if (ids.length > 0) parts.push(`${ids.length} control${ids.length > 1 ? 's' : ''}`)
        if (subIds.length > 0) parts.push(`${subIds.length} subcontrol${subIds.length > 1 ? 's' : ''}`)
        successNotification({ title: 'Updated', description: `${parts.join(' and ')} updated` })
        setSelectedControlIds(new Set())
        setSelectedSubcontrolIds(new Set())
      } catch {
        errorNotification({ title: 'Error', description: 'Failed to apply bulk update' })
      }
    },
    [selectedControlIds, selectedSubcontrolIds, bulkEditControl, bulkEditSubcontrol, fetchSubcontrolIds, orgCoverageMap, frameworkCoverageMap, isCustomView, successNotification, errorNotification],
  )

  const toggleReportFilter = useCallback((filterId: string) => {
    setReportFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filterId)) next.delete(filterId)
      else next.add(filterId)
      return next
    })
  }, [])

  const toggleControl = (id: string) => {
    setExpandedControls((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAll = () => {
    const activeData = filteredSortedData ?? sortedData
    if (!activeData) return
    const allCategories = activeData.map((item) => item.category)
    const hasAllExpanded = allCategories.every((cat) => expandedItems.includes(cat))
    setExpandedItems(hasAllExpanded ? [] : allCategories)
  }

  const toggleCategorySubcontrols = useCallback(
    (category: string, categoryControls: ControlGroupItem[]) => {
      const withSubs = categoryControls.filter((c) => c.subcontrolCount > 0)
      const allExpanded = withSubs.every((c) => expandedControls[c.id])
      setExpandedControls((prev) => {
        const next = { ...prev }
        withSubs.forEach((c) => {
          next[c.id] = !allExpanded
        })
        return next
      })
      // When expanding subcontrols, also open the accordion section if it is closed
      if (!allExpanded) {
        setExpandedItems((prev) => (prev.includes(category) ? prev : [...prev, category]))
      }
    },
    [expandedControls],
  )

  const selectFilter = (value: string) => {
    // Selecting the already-active option clears the filter
    const next = value === effectiveStandard ? '' : value
    setSelectedStandard(next)
    localStorage.setItem(REPORT_STANDARD_KEY, next)
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: '/programs' },
      { label: 'Controls', href: '/controls' },
    ])
  }, [setCrumbs])

  if (isLoading || !data) {
    return <ControlReportPageSkeleton />
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl tracking-[-0.056rem] text-header">Controls</h1>
          <TabSwitcher active={active} setActive={setActive} storageKey={TabSwitcherStorageKeys.CONTROL} />
          {!isLoading && !isFetching && !hasNoControls ? (
            <>
              <Button type="button" variant="outline" className="h-7.5 px-3 gap-1.5" onClick={toggleAll}>
                <ChevronsUpDown size={15} />
                {(filteredSortedData ?? sortedData ?? []).every((e) => expandedItems.includes(e.category)) ? 'Collapse all' : 'Expand all'}
              </Button>
              <Button
                type="button"
                className={`h-7.5 px-3 gap-1.5 ${isSelectionMode ? 'border border-primary' : ''}`}
                variant="outline"
                onClick={() => {
                  if (isSelectionMode) {
                    setSelectedControlIds(new Set())
                    setSelectedSubcontrolIds(new Set())
                  }
                  setIsSelectionMode((prev) => !prev)
                }}
              >
                <ListChecks size={15} />
                Select
              </Button>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" icon={<SlidersHorizontal />} iconPosition="left" className={`h-7.5 px-2! pl-3! ${effectiveStandard ? 'border border-primary' : ''}`}>
                <span className="text-muted-foreground">Filter by:</span>
                <span>
                  {effectiveStandard === 'CUSTOM' ? 'Organization Controls' : effectiveStandard ? (standardOptions.find((o) => o.value === effectiveStandard)?.label ?? 'Framework') : 'Framework'}
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto min-w-56">
              <DropdownMenuRadioGroup value={effectiveStandard} onValueChange={(v) => selectFilter(v)}>
                <DropdownMenuRadioItem value="CUSTOM">Organization Controls</DropdownMenuRadioItem>
                {standardOptions.map((opt) => (
                  <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                    <span className="truncate">{opt.label}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {!isLoading && !isFetching && !hasNoControls && (
            <Popover open={reportPopoverOpen} onOpenChange={setReportPopoverOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className={`h-7.5 px-2! pl-3! gap-1.5 ${reportFilters.size > 0 ? 'border border-primary' : ''}`}>
                  <FileSearch size={15} />
                  <span className="text-muted-foreground">Report on:</span>
                  <span>
                    {reportFilters.size === 0
                      ? 'All controls'
                      : reportFilters.size === 1
                        ? (REPORT_FILTER_OPTIONS.find((o) => reportFilters.has(o.id))?.label ?? 'Custom')
                        : `${reportFilters.size} criteria`}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-4 space-y-2">
                <p className="text-sm font-medium">Show controls that:</p>
                {REPORT_FILTER_OPTIONS.filter((opt) => {
                  if (opt.viewRestriction === 'framework') return !isCustomView
                  if (opt.viewRestriction === 'custom') return isCustomView
                  return true
                }).map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={reportFilters.has(opt.id)} onCheckedChange={() => toggleReportFilter(opt.id)} />
                    {opt.label}
                  </label>
                ))}
                {reportFilters.size > 0 && (
                  <Button variant="outline" className="w-full h-8 mt-1" onClick={() => setReportFilters(new Set())}>
                    Clear filters
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}
          {!isLoading && !isFetching && !hasNoControls ? (
            <Menu
              closeOnSelect={true}
              content={() => (
                <>
                  <BulkCSVCloneControlDialog
                    trigger={
                      <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                        <Upload size={16} strokeWidth={2} />
                        <span>Upload From Standard</span>
                      </Button>
                    }
                  />
                  <BulkCSVCreateControlDialog
                    trigger={
                      <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                        <Upload size={16} strokeWidth={2} />
                        <span>Upload Custom Controls</span>
                      </Button>
                    }
                  />
                  <BulkCSVCreateMappedControlDialog
                    trigger={
                      <Button size="sm" variant="transparent" className="flex items-center space-x-2 px-1">
                        <Upload size={16} strokeWidth={2} />
                        <span>Upload Control Mappings</span>
                      </Button>
                    }
                  />
                </>
              )}
            />
          ) : null}
          {createAllowed && !hasNoControls && (
            <Link href="/controls/create-control" aria-label="Create Control">
              <Button variant="primary" className="h-8 px-2! pl-3!" icon={<SquarePlus />} iconPosition="left">
                Create
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Bulk action bar — visible in selection mode when at least one control or subcontrol is selected */}
      {isSelectionMode && (selectedControlIds.size > 0 || selectedSubcontrolIds.size > 0) && (
        <div className="flex items-center gap-3 mt-3 px-3 py-2 rounded-md border border-border bg-muted/40">
          <span className="text-sm font-medium">
            {[
              selectedControlIds.size > 0 ? `${selectedControlIds.size} control${selectedControlIds.size > 1 ? 's' : ''}` : '',
              selectedSubcontrolIds.size > 0 ? `${selectedSubcontrolIds.size} subcontrol${selectedSubcontrolIds.size > 1 ? 's' : ''}` : '',
            ]
              .filter(Boolean)
              .join(', ')}{' '}
            selected
          </span>

          {/* Assign Owner popover */}
          <Popover open={ownerPopoverOpen} onOpenChange={setOwnerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-7.5 px-3 gap-1.5" icon={<UserCog size={14} />} iconPosition="left">
                Assign Owner
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3 p-4">
              <p className="text-sm font-medium">Assign Owner</p>
              <Select value={pendingOwnerId} onValueChange={setPendingOwnerId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select group…" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(
                    (g) =>
                      g && (
                        <SelectItem key={g.id} value={g.id}>
                          {g.displayName}
                        </SelectItem>
                      ),
                  )}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={ownerCascade.sub} onCheckedChange={(v) => setOwnerCascade((prev) => ({ ...prev, sub: !!v }))} />
                Apply to subcontrols
              </label>
              {!isCustomView && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={ownerCascade.mapped} onCheckedChange={(v) => setOwnerCascade((prev) => ({ ...prev, mapped: !!v }))} />
                  Apply to mapped org controls
                </label>
              )}
              <Button
                variant="primary"
                className="w-full h-8"
                disabled={!pendingOwnerId}
                onClick={() => {
                  handleBulkAction({ controlOwnerID: pendingOwnerId }, { subcontrols: ownerCascade.sub, mappedControls: ownerCascade.mapped })
                  setOwnerPopoverOpen(false)
                  setPendingOwnerId('')
                  setOwnerCascade({ sub: false, mapped: false })
                }}
              >
                Apply
              </Button>
            </PopoverContent>
          </Popover>

          {/* Set Status popover */}
          <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-7.5 px-3 gap-1.5" icon={<Tag size={14} />} iconPosition="left">
                Set Status
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3 p-4">
              <p className="text-sm font-medium">Set Status</p>
              <Select value={pendingStatus} onValueChange={setPendingStatus}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent>
                  {ControlStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={statusCascade.sub} onCheckedChange={(v) => setStatusCascade((prev) => ({ ...prev, sub: !!v }))} />
                Apply to subcontrols
              </label>
              {!isCustomView && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={statusCascade.mapped} onCheckedChange={(v) => setStatusCascade((prev) => ({ ...prev, mapped: !!v }))} />
                  Apply to mapped org controls
                </label>
              )}
              <Button
                variant="primary"
                className="w-full h-8"
                disabled={!pendingStatus}
                onClick={() => {
                  handleBulkAction({ status: pendingStatus as ControlControlStatus }, { subcontrols: statusCascade.sub, mappedControls: statusCascade.mapped })
                  setStatusPopoverOpen(false)
                  setPendingStatus('')
                  setStatusCascade({ sub: false, mapped: false })
                }}
              >
                Apply
              </Button>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            className="h-7.5 px-2 ml-auto"
            icon={<X size={14} />}
            iconPosition="left"
            onClick={() => {
              setSelectedControlIds(new Set())
              setSelectedSubcontrolIds(new Set())
            }}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {isLoading || isFetching ? (
          <ControlReportPageSkeleton />
        ) : hasNoControls ? (
          <div className="max-w-6xl mx-auto">
            <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">
              No controls found. <span className="text-foreground font-medium">Create one now</span> using any option below.
            </p>

            <div className="mt-6 grid grid-cols-3">
              <div className="col-span-2 grid">
                <ControlsEmptyActions />
              </div>

              <div className="row-span-2 ml-4">
                <Callout variant="info" title="What are Controls?" className="h-full self-stretch ">
                  <br />
                  Controls are the foundation of your compliance program in Openlane. Each control defines a specific security, privacy, or operational requirement that your organization follows to
                  protect systems and data. <br />
                  <br />
                  Controls serve as the bridge between high-level compliance frameworks (like SOC 2 or ISO 27001) and the actual policies, procedures, and evidence your team manages day-to-day. By
                  implementing and maintaining controls, you demonstrate how your organization meets key standards and reduces risk across your environment.
                  <br />
                  <br />
                  <a
                    href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/controls/overview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-(--color-info) underline underline-offset-4 hover:opacity-80"
                  >
                    See docs to learn more.
                  </a>
                </Callout>
              </div>
            </div>
          </div>
        ) : (
          <>
            {reportFilters.size > 0 && filteredSortedData?.length === 0 && (
              <p className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">No controls match the selected report filters.</p>
            )}
            <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems}>
              {filteredSortedData?.map(({ category, controls }) => {
                if (controls.length === 0) return null
                const hasSubs = controls.some((c) => c.subcontrolCount > 0)
                const allSubsExpanded = controls.filter((c) => c.subcontrolCount > 0).every((c) => expandedControls[c.id])
                const approvedCount = controls.filter((c) => c.status === ControlControlStatus.APPROVED).length
                const approvalPct = controls.length > 0 ? (approvedCount / controls.length) * 100 : 0
                const accentColor = approvalPct === 100 ? '#22c55e' : approvalPct > 0 ? '#fbbf24' : 'var(--color-border)'
                const barClass = approvalPct === 100 ? 'coverage-bar-complete' : approvalPct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'

                return (
                  <AccordionItem className="mt-3 border border-border rounded-md overflow-hidden border-l-4" style={{ borderLeftColor: accentColor }} key={category} value={category}>
                    <div className="flex justify-between items-center px-4 py-3">
                      <AccordionTrigger asChild className="bg-unset">
                        <button className="size-fit group flex items-center gap-2">
                          <ChevronDown size={22} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
                          <span className="text-xl">{category || 'General'}</span>
                        </button>
                      </AccordionTrigger>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[88px] text-right">
                            <span className="font-medium text-foreground">{approvedCount}</span>/{controls.length} approved
                          </span>
                          <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden shrink-0">
                            <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${approvalPct}%` }} />
                          </div>
                        </div>
                        {hasSubs && expandedItems.includes(category) && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-7 px-2.5 text-xs gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCategorySubcontrols(category, controls)
                            }}
                          >
                            <ChevronsUpDown size={12} />
                            {allSubsExpanded ? 'Collapse subcontrols' : 'Expand subcontrols'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <AccordionContent>
                      <div className="border-t border-border overflow-hidden">
                        <ControlTableHeader
                          isCustomView={isCustomView}
                          isSelectionMode={isSelectionMode}
                          allIds={controls.map((c) => c.id)}
                          selectedIds={selectedControlIds}
                          onSelectAll={(ids) => setSelectionForCategory(ids, ids.length > 0)}
                        />
                        {controls.map((control) => (
                          <React.Fragment key={control.id}>
                            <ControlRow
                              control={control}
                              expanded={!!expandedControls[control.id]}
                              onToggle={() => toggleControl(control.id)}
                              isCustomView={isCustomView}
                              isSelectionMode={isSelectionMode}
                              coverageData={orgCoverageMap.get(control.id)}
                              frameworkData={frameworkCoverageMap.get(control.id)}
                              selected={selectedControlIds.has(control.id)}
                              onSelect={toggleSelection}
                            />
                            {expandedControls[control.id] && (
                              <SubcontrolRows
                                controlId={control.id}
                                isCustomView={isCustomView}
                                isSelectionMode={isSelectionMode}
                                selectedSubcontrolIds={selectedSubcontrolIds}
                                onSelectSubcontrol={toggleSubcontrolSelection}
                                onSelectAllSubcontrols={batchSelectSubcontrols}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </>
        )}
      </div>
    </div>
  )
}

export default ControlReportPage

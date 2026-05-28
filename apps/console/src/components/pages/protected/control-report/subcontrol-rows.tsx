'use client'

import React from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { useOrgCoverageForSubcontrol, useFrameworkCoverageForSubcontrol, EVIDENCE_SEVERITY_ORDER } from '@/lib/graphql-hooks/mapped-control'
import { type ControlControlStatus, EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { CONTROL_STATUS_STYLES } from '@/components/shared/enum-mapper/control-enum'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Checkbox } from '@repo/ui/checkbox'
import { toBase64DataUri } from '@/lib/image-utils'
import { TruncatedCell } from '@repo/ui/data-table'
import { type MapControl } from '@/types'
import ControlChip from '../controls/map-controls/shared/control-chip'
import OrgCoverageCell from './org-coverage-cell'
import EvidenceCoverageCell from './evidence-coverage-cell'
import { getGridCols } from './control-report-grid'

type ControlOwner = { displayName?: string | null; gravatarLogoURL?: string | null; avatarFile?: { base64?: string | null } | null } | null

type SubcontrolRowProps = {
  sub: { id: string; refCode: string; description?: string | null; status?: string | null; evidenceRefs?: Array<{ id: string; name: string; status?: string | null }> }
  controlId: string
  isCustomView: boolean
  isSelectionMode: boolean
  controlOwner?: ControlOwner
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}

const SubcontrolRow: React.FC<SubcontrolRowProps> = ({ sub, controlId, isCustomView, isSelectionMode, controlOwner, selected, onSelect }) => {
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

      <div />

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

      <TruncatedCell className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {sub.description ? convertToReadOnly(sub.description, 0) : <span className="italic">No description</span>}
      </TruncatedCell>

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

      {!isCustomView && (
        <div>
          <OrgCoverageCell data={coverageData} />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <EvidenceCoverageCell
          totalCount={allSubEvidenceRefs.length}
          approvedCount={subEvidenceApproved}
          worstStatus={subEvidenceWorstStatus}
          evidenceRefs={allSubEvidenceRefs}
          primaryControlId={`${controlId}/${sub.id}`}
        />
      </div>

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

type SubcontrolRowsProps = {
  controlId: string
  isCustomView: boolean
  isSelectionMode: boolean
  selectedSubcontrolIds: Set<string>
  onSelectSubcontrol: (id: string, checked: boolean) => void
  onSelectAllSubcontrols: (ids: string[], checked: boolean) => void
}

const SubcontrolRows: React.FC<SubcontrolRowsProps> = ({ controlId, isCustomView, isSelectionMode, selectedSubcontrolIds, onSelectSubcontrol, onSelectAllSubcontrols }) => {
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

export default SubcontrolRows

'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type ControlReportItem, type ControlReportSubcontrolItem } from '@/lib/graphql-hooks/control'
import { type ControlControlStatus } from '@repo/codegen/src/schema'
import { CONTROL_STATUS_STYLES } from '@/components/shared/enum-mapper/control-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Checkbox } from '@repo/ui/checkbox'
import { toBase64DataUri } from '@/lib/image-utils'
import { TruncatedCell } from '@repo/ui/data-table'
import { type MapControl } from '@/types'
import ControlChip from '../controls/map-controls/shared/control-chip'
import OrgCoverageCell from './org-coverage-cell'
import EvidenceCoverageCell from './evidence-coverage-cell'
import { getGridCols } from './control-report-grid'
import { deriveOrgCoverage, getOrgRelatedControls, getFrameworkRelatedControls } from './report-coverage'

type ControlOwner = ControlReportItem['controlOwner']

type SubcontrolRowProps = {
  sub: ControlReportSubcontrolItem
  controlId: string
  isCustomView: boolean
  isSelectionMode: boolean
  controlOwner?: ControlOwner
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}

export const SubcontrolRow = React.memo(({ sub, controlId, isCustomView, isSelectionMode, controlOwner, selected, onSelect }: SubcontrolRowProps) => {
  const gridCols = getGridCols(isCustomView, isSelectionMode)
  const { convertToReadOnly } = usePlateEditor()
  const descriptionNode = useMemo(() => (sub.description ? convertToReadOnly(sub.description, 0) : <span className="italic">No description</span>), [sub.description, convertToReadOnly])

  const subStatusStyle = sub.status ? CONTROL_STATUS_STYLES[sub.status as ControlControlStatus] : null
  const orgCoverage = deriveOrgCoverage(sub.relatedControls)
  const policies = sub.linkedPolicies?.internalPolicies ?? []
  const orgRefs = getOrgRelatedControls(sub.relatedControls)
  const frameworkRefs = getFrameworkRelatedControls(sub.relatedControls)

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
            {getEnumLabel(sub.status ?? undefined)}
          </span>
        )}
      </div>

      <TruncatedCell lineClamp={2} className="text-xs text-muted-foreground leading-relaxed">
        {descriptionNode}
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
          <OrgCoverageCell data={orgCoverage} />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <EvidenceCoverageCell data={sub.evidenceStatus} primaryControlId={`${controlId}/${sub.id}`} />
      </div>

      <div className="flex flex-wrap gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        {policies.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">None linked</span>
        ) : (
          policies.map((p) => (
            <Link key={p.id} href={`/policies/${p.id}/view`} target="_blank" rel="noopener noreferrer">
              <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-accent cursor-pointer">{p.name}</span>
            </Link>
          ))
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
        {isCustomView
          ? frameworkRefs.map((ref) => (
              <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode, referenceFramework: ref.referenceFramework } as MapControl} hideStandard />
            ))
          : orgRefs.map((ref) => <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode } as MapControl} hideStandard hideHexagon />)}
      </div>
    </div>
  )
})

SubcontrolRow.displayName = 'SubcontrolRow'

type SubcontrolGroupHeaderProps = {
  subIds: string[]
  isSelectionMode: boolean
  selectedSubcontrolIds: Set<string>
  onSelectAllSubcontrols: (ids: string[], checked: boolean) => void
}

export const SubcontrolGroupHeader: React.FC<SubcontrolGroupHeaderProps> = ({ subIds, isSelectionMode, selectedSubcontrolIds, onSelectAllSubcontrols }) => {
  const allSelected = subIds.length > 0 && subIds.every((id) => selectedSubcontrolIds.has(id))
  const someSelected = subIds.some((id) => selectedSubcontrolIds.has(id)) && !allSelected

  return (
    <div className="bg-background-secondary px-3 py-1 flex items-center gap-2">
      {isSelectionMode && (
        <Checkbox checked={allSelected ? true : someSelected ? 'indeterminate' : false} onCheckedChange={(v) => onSelectAllSubcontrols(subIds, !!v)} aria-label="Select all subcontrols" />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subcontrols</span>
    </div>
  )
}

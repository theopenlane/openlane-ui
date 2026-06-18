'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'
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

type ControlRowProps = {
  control: ControlReportItem
  expanded: boolean
  onToggle: (id: string) => void
  isCustomView: boolean
  isSelectionMode: boolean
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
}

const ControlRow: React.FC<ControlRowProps> = ({ control, expanded, onToggle, isCustomView, isSelectionMode, selected, onSelect }) => {
  const hasSubcontrols = (control.subcontrols?.length ?? 0) > 0
  const gridCols = getGridCols(isCustomView, isSelectionMode)
  const { convertToReadOnly } = usePlateEditor()
  const descriptionNode = useMemo(
    () => (control.description ? convertToReadOnly(control.description, 0) : <span className="italic text-muted-foreground">No description</span>),
    [control.description, convertToReadOnly],
  )

  const orgCoverage = deriveOrgCoverage(control.relatedControls)
  const controlStatusStyle = control.status ? CONTROL_STATUS_STYLES[control.status as ControlControlStatus] : null
  const linkedPolicies = control.linkedPolicies?.internalPolicies ?? []
  const orgRefs = getOrgRelatedControls(control.relatedControls)
  const frameworkRefs = getFrameworkRelatedControls(control.relatedControls)

  return (
    <div
      className={`grid gap-x-3 px-3 py-2.5 items-start border-b last:border-b-0 transition-colors ${expanded ? 'bg-background-secondary' : 'hover:bg-muted/30'} ${hasSubcontrols ? 'cursor-pointer' : ''}`}
      style={{ gridTemplateColumns: gridCols }}
      onClick={hasSubcontrols ? () => onToggle(control.id) : undefined}
    >
      {isSelectionMode && (
        <div className="flex items-center pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(control.id, !!v)} aria-label="Select row" />
        </div>
      )}

      <div className="flex items-center justify-center pt-0.5 h-5">
        {hasSubcontrols && <ChevronRight size={13} className={`text-muted-foreground transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <Link href={`/controls/${control.id}`} className="text-brand hover:underline font-medium text-sm whitespace-nowrap">
          {control.refCode}
        </Link>
        {controlStatusStyle && (
          <span className="mt-1 block text-[10px] px-1.5 py-0.5 rounded-full w-fit" style={{ backgroundColor: controlStatusStyle.bg, color: controlStatusStyle.color }}>
            {getEnumLabel(control.status ?? undefined)}
          </span>
        )}
      </div>

      <TruncatedCell lineClamp={2} className="text-sm leading-relaxed text-foreground">
        {descriptionNode}
      </TruncatedCell>

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

      {!isCustomView && (
        <div>
          <OrgCoverageCell data={orgCoverage} />
        </div>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        <EvidenceCoverageCell data={control.evidenceStatus} primaryControlId={control.id} />
      </div>

      <div className="flex flex-wrap gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
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
        <div className="flex flex-wrap gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
          {frameworkRefs.map((ref) => (
            <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode, referenceFramework: ref.referenceFramework } as MapControl} hideStandard />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
          {orgRefs.map((ref) => (
            <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode } as MapControl} hideStandard hideHexagon />
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(ControlRow)

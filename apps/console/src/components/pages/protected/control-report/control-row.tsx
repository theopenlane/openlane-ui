'use client'

import { activatable } from '@repo/ui/lib/a11y'
import React, { useMemo } from 'react'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Checkbox } from '@repo/ui/checkbox'
import { cn } from '@repo/ui/lib/utils'
import { toBase64DataUri } from '@/lib/image-utils'
import { TruncatedCell } from '@repo/ui/data-table'
import ControlChip from '../controls/map-controls/shared/control-chip'
import RefCodeCell from './ref-code-cell'
import LinkedPolicyChip from './linked-policy-chip'
import OrgCoverageCell from './org-coverage-cell'
import EvidenceCoverageCell from './evidence-coverage-cell'
import ReportShowMore from './report-show-more'
import { GRID_ROW_CLASS, getGridCols } from './control-report-grid'
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
  const linkedPolicies = control.linkedPolicies?.internalPolicies ?? []
  const orgRefs = getOrgRelatedControls(control.relatedControls)
  const frameworkRefs = getFrameworkRelatedControls(control.relatedControls)

  return (
    <div
      className={cn(
        GRID_ROW_CLASS,
        'px-3 py-2.5 items-start border-b last:border-b-0 transition-colors',
        expanded ? 'bg-background-secondary' : 'hover:bg-muted/30',
        hasSubcontrols && 'cursor-pointer',
      )}
      style={{ gridTemplateColumns: gridCols }}
      {...activatable(hasSubcontrols ? () => onToggle(control.id) : undefined)}
    >
      {isSelectionMode && (
        <div role="presentation" className="flex items-center pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(control.id, !!v)} aria-label="Select row" />
        </div>
      )}

      <div className="flex items-center justify-center pt-0.5 h-5">
        {hasSubcontrols && <ChevronRight size={13} className={`text-muted-foreground transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`} />}
      </div>

      <RefCodeCell href={`/controls/${control.id}`} refCode={control.refCode} status={control.status} />

      <TruncatedCell portal lineClamp={2} className="text-sm leading-relaxed text-foreground">
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
        <div className="overflow-hidden">
          <OrgCoverageCell data={orgCoverage} />
        </div>
      )}

      <div role="presentation" className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <EvidenceCoverageCell data={control.evidenceStatus} primaryControlId={control.id} />
      </div>

      <div role="presentation" className="flex flex-wrap gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        {linkedPolicies.length === 0 ? (
          <span className="text-xs italic text-muted-foreground">None linked</span>
        ) : (
          <ReportShowMore items={linkedPolicies} renderItem={(p) => <LinkedPolicyChip key={p.id} id={p.id} name={p.name} />} />
        )}
      </div>

      {isCustomView ? (
        <div role="presentation" className="flex flex-wrap gap-1.5 min-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <ReportShowMore
            items={frameworkRefs}
            renderItem={(ref) => <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode, referenceFramework: ref.referenceFramework }} hideStandard />}
          />
        </div>
      ) : (
        <div role="presentation" className="flex flex-wrap gap-1.5 min-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <ReportShowMore items={orgRefs} renderItem={(ref) => <ControlChip key={ref.id} control={{ __typename: 'Control', id: ref.id, refCode: ref.refCode }} hideStandard hideHexagon />} />
        </div>
      )}
    </div>
  )
}

export default React.memo(ControlRow)

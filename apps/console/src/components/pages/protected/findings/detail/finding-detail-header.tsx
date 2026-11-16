'use client'

import React from 'react'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'
import { SeverityChip } from '@/components/shared/severity/severity-chip'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { deleteMenuAction } from '@/components/shared/crud-base/slideout-header'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { type FindingDetailNode } from '@/lib/graphql-hooks/finding'
import { MetaItem } from '../../exposure/detail/meta-item'
import { RemediationSla } from '../../exposure/detail/remediation-sla'
import { RemediationSlaField } from '../../exposure/detail/remediation-sla-field'
import { ScoreMeta } from '../../exposure/detail/score/score-meta'
import { getFindingSeverity, getFindingTitle } from '../finding-display'
import { hasExposureSourceDetails } from '../../exposure/detail/source/use-exposure-source'
import { ExposureSourcePopover } from '../../exposure/detail/source/exposure-source-popover'
import { getFindingSourceRows } from './finding-source'
import { FindingStatusField } from './finding-status-field'

type TFindingDetailHeaderProps = {
  finding: FindingDetailNode
  isEditing: boolean
  isSaving: boolean
  canEdit: boolean
  canDelete: boolean
  onEdit: (event: React.MouseEvent<HTMLButtonElement>) => void
  onCancel: (event: React.MouseEvent<HTMLButtonElement>) => void
  onDeleteClick: () => void
  onAskAI: () => void
  handleUpdateField: (input: UpdateFindingInput, options?: TPersistOptions) => Promise<void>
}

const FindingDetailHeader: React.FC<TFindingDetailHeaderProps> = ({ finding, isEditing, isSaving, canEdit, canDelete, onEdit, onCancel, onDeleteClick, onAskAI, handleUpdateField }) => {
  const sourceRows = getFindingSourceRows(finding)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-48 flex-1 flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold break-words">{getFindingTitle(finding)}</h1>
          <SeverityChip severity={getFindingSeverity(finding)} />
        </div>
        <DetailHeaderActions
          isEditing={isEditing}
          isSaving={isSaving}
          onCancel={onCancel}
          onEdit={canEdit ? onEdit : undefined}
          editLabel="Edit finding"
          onAskAI={onAskAI}
          menuAnchor={elementAnchor('finding-actions-menu')}
          menuActions={[canDelete && { ...deleteMenuAction(onDeleteClick), anchor: elementAnchor('finding-delete-button') }]}
        />
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <MetaItem label="Status">
          <FindingStatusField isEditing={isEditing} canEdit={canEdit} handleUpdateField={handleUpdateField} />
        </MetaItem>
        <MetaItem label="Score">
          <ScoreMeta score={finding.score} vector={finding.vector} />
        </MetaItem>
        <MetaItem label="Remediation SLA">{isEditing ? <RemediationSlaField /> : <RemediationSla item={finding} />}</MetaItem>
        {hasExposureSourceDetails(finding, sourceRows) && (
          <MetaItem label="Source">
            <ExposureSourcePopover fields={finding} extraRows={sourceRows} />
          </MetaItem>
        )}
      </div>
    </div>
  )
}

export default FindingDetailHeader

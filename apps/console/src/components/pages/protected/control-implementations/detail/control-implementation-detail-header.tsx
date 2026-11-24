'use client'

import React from 'react'
import { Calendar, CopyPlus } from 'lucide-react'
import { type ControlImplementationDocumentStatus } from '@repo/codegen/src/schema'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { deleteMenuAction } from '@/components/shared/crud-base/slideout-header'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { type ControlImplementationDetailNode } from '@/lib/graphql-hooks/control-implementation'
import { formatDate } from '@/utils/date'
import { StatusChip, VerifiedChip } from './control-implementation-chips'

type TControlImplementationDetailHeaderProps = {
  implementation: ControlImplementationDetailNode
  title: string
  isEditing: boolean
  isSaving: boolean
  canEdit: boolean
  canDelete: boolean
  canClone: boolean
  onEdit: () => void
  onCancel: () => void
  onAskAI: () => void
  onClone: () => void
  onDelete: () => void
  onStatusChange: (status: ControlImplementationDocumentStatus) => void
  onVerifiedChange: (verified: boolean) => void
}

const ControlImplementationDetailHeader: React.FC<TControlImplementationDetailHeaderProps> = ({
  implementation,
  title,
  isEditing,
  isSaving,
  canEdit,
  canDelete,
  canClone,
  onEdit,
  onCancel,
  onAskAI,
  onClone,
  onDelete,
  onStatusChange,
  onVerifiedChange,
}) => (
  <div className="space-y-2">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-48 flex-1 flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold break-words">{title}</h1>
        {!isEditing && <StatusChip status={implementation.status} canEdit={canEdit} disabled={isSaving} onChange={onStatusChange} />}
        <VerifiedChip verified={!!implementation.verified} canEdit={canEdit && !isEditing} disabled={isSaving} onChange={onVerifiedChange} />
      </div>
      <DetailHeaderActions
        isEditing={isEditing}
        isSaving={isSaving}
        onCancel={onCancel}
        onEdit={canEdit ? onEdit : undefined}
        editLabel="Edit control implementation"
        onAskAI={onAskAI}
        menuAnchor={elementAnchor('control-implementation-actions-menu')}
        menuActions={[
          canClone && { key: 'clone', label: 'Clone', icon: <CopyPlus size={16} strokeWidth={2} />, onClick: onClone, anchor: elementAnchor('control-implementation-clone-button') },
          canDelete && { ...deleteMenuAction(onDelete), anchor: elementAnchor('control-implementation-delete-button') },
        ]}
      />
    </div>
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Calendar size={16} />
      {implementation.implementationDate ? `Implemented ${formatDate(implementation.implementationDate)}` : 'No implementation date'}
    </p>
  </div>
)

export default ControlImplementationDetailHeader

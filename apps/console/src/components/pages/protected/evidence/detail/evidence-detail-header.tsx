'use client'

import React, { useState } from 'react'
import { RefreshCw, Repeat, Stamp } from 'lucide-react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { EvidenceRenewDialog } from '@/components/pages/protected/evidence/evidence-renew-dialog'
import { deleteMenuAction, copyLinkMenuAction, SlideoutHeader, type SlideoutMenuAction } from '@/components/shared/crud-base/slideout-header'
import EvidenceStatusChipSelect from './evidence-status-chip-select'

type TEvidenceDetailHeaderProps = {
  evidenceId?: string
  status?: EvidenceEvidenceStatus | null
  controlId?: string
  isEditing: boolean
  isAuditor: boolean
  editAllowed: boolean
  editPermissionLoading: boolean
  isLoading: boolean
  deleteAllowed: boolean
  auditorActionPending: boolean
  onStatusChange: (status: EvidenceEvidenceStatus) => void
  onCopyLink: () => void
  onEdit: () => void
  onDelete: () => void
  onApprove: () => void
  onRequestChanges: () => void
  onClose: () => void
}

const EvidenceDetailHeader: React.FC<TEvidenceDetailHeaderProps> = ({
  evidenceId,
  status,
  controlId,
  isEditing,
  isAuditor,
  editAllowed,
  editPermissionLoading,
  isLoading,
  deleteAllowed,
  auditorActionPending,
  onStatusChange,
  onCopyLink,
  onEdit,
  onDelete,
  onApprove,
  onRequestChanges,
  onClose,
}) => {
  const [isRenewOpen, setIsRenewOpen] = useState(false)

  const menuActions: SlideoutMenuAction[] = isLoading
    ? []
    : [
        copyLinkMenuAction(onCopyLink),
        ...(evidenceId && !isAuditor && !isEditing ? [{ key: 'renew', label: 'Renew', icon: <Repeat size={16} strokeWidth={2} />, onClick: () => setIsRenewOpen(true) }] : []),
        ...(evidenceId && isAuditor && !isEditing
          ? [{ key: 'request-changes', label: 'Request changes', icon: <RefreshCw size={16} strokeWidth={2} />, onClick: onRequestChanges, disabled: auditorActionPending }]
          : []),
        ...(deleteAllowed ? [deleteMenuAction(onDelete)] : []),
      ]

  const canEdit = !isLoading && !isEditing && (editAllowed || editPermissionLoading)

  return (
    <>
      <SlideoutHeader
        title="Evidence"
        titleAdornment={evidenceId ? <EvidenceStatusChipSelect status={status} editAllowed={editAllowed} onChange={onStatusChange} /> : undefined}
        onClose={onClose}
        onEdit={canEdit ? onEdit : undefined}
        editDisabled={editPermissionLoading}
        primaryAction={
          !isLoading && isAuditor && evidenceId && !isEditing
            ? {
                label: 'Approve',
                icon: <Stamp size={16} />,
                onClick: onApprove,
                loading: auditorActionPending,
                disabled: auditorActionPending || status === EvidenceEvidenceStatus.AUDITOR_APPROVED,
              }
            : undefined
        }
        menuActions={menuActions}
      />
      {evidenceId && !isAuditor && !isEditing && <EvidenceRenewDialog evidenceId={evidenceId} controlId={controlId} open={isRenewOpen} onOpenChange={setIsRenewOpen} />}
    </>
  )
}

export default EvidenceDetailHeader

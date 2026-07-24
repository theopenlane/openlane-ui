'use client'

import React from 'react'
import { Copy, Pencil, RefreshCw, Stamp, Trash2, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { SheetHeader } from '@repo/ui/sheet'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { EvidenceRenewDialog } from '@/components/pages/protected/evidence/evidence-renew-dialog'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import EvidenceStatusChipSelect from './evidence-status-chip-select'

type TEvidenceDetailHeaderProps = {
  evidenceId?: string
  status?: EvidenceEvidenceStatus | null
  controlId?: string
  isEditing: boolean
  isAuditor: boolean
  editAllowed: boolean
  auditorActionPending: boolean
  onStatusChange: (status: EvidenceEvidenceStatus) => void
  onCopyLink: () => void
  onEdit: () => void
  onCancelEdit: () => void
  onSave: () => void
  saveLabel?: string
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
  auditorActionPending,
  onStatusChange,
  onCopyLink,
  onEdit,
  onCancelEdit,
  onSave,
  saveLabel,
  onDelete,
  onApprove,
  onRequestChanges,
  onClose,
}) => (
  <SheetHeader>
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl leading-8 font-medium">Evidence</span>
        {evidenceId && <EvidenceStatusChipSelect status={status} editAllowed={editAllowed} onChange={onStatusChange} />}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <CancelButton onClick={onCancelEdit} />
            <SaveButton onClick={onSave} title={saveLabel} />
          </>
        ) : (
          <>
            <Button className="h-8 p-2" icon={<Copy />} iconPosition="left" variant="secondary" onClick={onCopyLink}>
              Copy link
            </Button>
            {evidenceId && !isAuditor && <EvidenceRenewDialog evidenceId={evidenceId} controlId={controlId} />}
            {isAuditor && evidenceId && (
              <>
                <Button
                  type="button"
                  className="h-8 p-2"
                  icon={<Stamp size={16} />}
                  iconPosition="left"
                  onClick={onApprove}
                  loading={auditorActionPending}
                  disabled={auditorActionPending || status === EvidenceEvidenceStatus.AUDITOR_APPROVED}
                >
                  Approve
                </Button>
                <Button type="button" variant="destructive" className="h-8 p-2" icon={<RefreshCw size={16} />} iconPosition="left" onClick={onRequestChanges} disabled={auditorActionPending}>
                  Request Changes
                </Button>
              </>
            )}
            {editAllowed && (
              <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={onEdit} aria-label="Edit evidence">
                <Pencil size={16} strokeWidth={2} />
              </Button>
            )}
            <Button type="button" variant="secondary" className="p-1! h-8 bg-card" onClick={onDelete} aria-label="Delete evidence">
              <Trash2 size={16} strokeWidth={2} />
            </Button>
          </>
        )}
        <X aria-label="Close detail sheet" size={20} className="cursor-pointer shrink-0" onClick={onClose} />
      </div>
    </div>
  </SheetHeader>
)

export default EvidenceDetailHeader

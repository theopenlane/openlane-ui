'use client'

import React from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type RestoreDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  revision: string
  onConfirm: () => void
  isPending?: boolean
}

const RestoreDialog: React.FC<RestoreDialogProps> = ({ open, onOpenChange, revision, onConfirm, isPending }) => {
  const description = (
    <>
      Restore <b>{revision || 'this version'}</b>? This will overwrite the current policy with this version. If the policy was approved, it will be moved back to <b>Needs Approval</b> and will require
      re-approval before taking effect.
    </>
  )

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Restore Policy Version"
      description={description}
      confirmationText={isPending ? 'Restoring…' : 'Restore version'}
      confirmationTextVariant="primary"
      loading={isPending}
    />
  )
}

export default RestoreDialog

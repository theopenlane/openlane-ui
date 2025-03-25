'use client'
import React, { useState } from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type TCancelDialogProps = {
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}

const CancelDialog: React.FC<TCancelDialogProps> = ({ onConfirm, onCancel, isOpen }) => {
  return (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      onConfirm={onConfirm}
      confirmationText="Confirm"
      confirmationTextVariant="redOutline"
      description="You have unsaved changes. Do you want to discard them?"
    />
  )
}

export default CancelDialog

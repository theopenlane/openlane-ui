'use client'

import React from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  primaryLabel: string
  secondaryLabel: string
  labelSingular: string
}

export const MergeConfirmDialog = ({ open, onOpenChange, onConfirm, primaryLabel, secondaryLabel, labelSingular }: Props) => {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={`Merge ${labelSingular}`}
      description={
        <>
          The primary <b>{primaryLabel}</b> will be updated with the selected values, and the secondary <b>{secondaryLabel}</b> will be permanently deleted. This cannot be undone.
        </>
      }
      confirmationText="Merge and delete"
      confirmationTextVariant="destructive"
      showInput
    />
  )
}

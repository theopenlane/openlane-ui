'use client'
import React from 'react'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { toHumanLabel } from '@/utils/strings'

interface GenericDeleteDialogProps {
  entityId: string
  entityType: ObjectTypes
  displayName?: string
  onDelete: (id: string) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const GenericDeleteDialog: React.FC<GenericDeleteDialogProps> = ({ entityId, entityType, displayName, onDelete, open, onOpenChange }) => {
  const { errorNotification } = useNotification()

  const entityLabel = displayName ?? toHumanLabel(entityType)

  const handleDelete = async () => {
    if (!entityId) {
      onOpenChange(false)
      return
    }

    try {
      await onDelete(entityId)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })
    } finally {
      onOpenChange(false)
    }
  }

  return (
    <ConfirmationDialog
      title={`Delete ${entityLabel}`}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      description={<>This action cannot be undone. This will permanently remove this {entityLabel.toLowerCase()} from the organization.</>}
    />
  )
}

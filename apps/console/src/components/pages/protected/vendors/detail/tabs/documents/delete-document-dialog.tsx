'use client'

import React from 'react'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useQueryClient } from '@tanstack/react-query'

interface DeleteDocumentDialogProps {
  fileId: string
  fileName: string
  vendorId: string
  onClose: () => void
}

const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({ fileId, fileName, vendorId, onClose }) => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateEntity } = useUpdateEntity()
  const queryClient = useQueryClient()

  const handleConfirm = async () => {
    try {
      await updateEntity({
        updateEntityId: vendorId,
        input: {
          removeFileIDs: [fileId],
        },
      })

      queryClient.invalidateQueries({ queryKey: ['entityFiles'] })

      successNotification({
        title: 'Document removed',
        description: `"${fileName}" has been removed from this vendor.`,
      })
      onClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <ConfirmationDialog
      open
      onOpenChange={(open) => !open && onClose()}
      onConfirm={handleConfirm}
      title="Remove document?"
      description={
        <>
          Are you sure you want to remove <b>{fileName}</b> from this vendor? This action cannot be undone.
        </>
      }
    />
  )
}

export default DeleteDocumentDialog

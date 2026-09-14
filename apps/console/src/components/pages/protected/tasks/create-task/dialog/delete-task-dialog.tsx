'use client'
import React from 'react'
import { useNotification } from '@/hooks/useNotification'

import { useDeleteTask } from '@/lib/graphql-hooks/task'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type DeleteTaskDialogProps = {
  taskName: string
  taskId: string
  onDeleted: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteTaskDialog: React.FC<DeleteTaskDialogProps> = ({ taskName, taskId, onDeleted, open, onOpenChange }) => {
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: deleteTask } = useDeleteTask()

  const handleDelete = async () => {
    if (!taskId) return

    try {
      onDeleted()
      await deleteTask({ deleteTaskId: taskId })
      successNotification({ title: `Task deleted successfully.` })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      onOpenChange(false)
    }
  }

  return (
    <ConfirmationDialog
      title={`Delete Task`}
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleDelete}
      description={
        <>
          This action cannot be undone. This will permanently remove <b>{taskName}</b> from the organization.
        </>
      }
    />
  )
}

export default DeleteTaskDialog

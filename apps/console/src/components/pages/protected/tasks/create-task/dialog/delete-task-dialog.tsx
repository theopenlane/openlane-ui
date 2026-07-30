'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'

import { useDeleteTask } from '@/lib/graphql-hooks/task'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canDelete } from '@/lib/authz/utils.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const DeleteTaskDialog: React.FC<{ taskName: string; taskId: string; onDeleted: () => void }> = ({ taskName, taskId, onDeleted }) => {
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(ObjectTypes.TASK, taskId)
  const [isOpen, setIsOpen] = useState(false)

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
      setIsOpen(false)
    }
  }

  if (!canDelete(permission?.roles)) {
    return null
  }

  return (
    <>
      <Button icon={<Trash2 />} iconPosition="left" variant="secondary" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmationDialog
        title={`Delete Task`}
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{taskName}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default DeleteTaskDialog

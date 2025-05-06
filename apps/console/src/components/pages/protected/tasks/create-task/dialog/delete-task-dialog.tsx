'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteTask } from '@/lib/graphql-hooks/tasks'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api.ts'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'

const DeleteTaskDialog: React.FC<{ taskName: string }> = ({ taskName }) => {
  const { selectedTask, setSelectedTask } = useTaskStore()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.TASK, selectedTask!)
  const [isOpen, setIsOpen] = useState(false)

  const { mutateAsync: deleteTask } = useDeleteTask()

  const handleDelete = async () => {
    if (!selectedTask) return

    try {
      await deleteTask({ deleteTaskId: selectedTask as string })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({ title: `Task deleted successfully.` })
      setSelectedTask(null)
    } catch (error) {
      errorNotification({ title: 'Failed to delete task.' })
    } finally {
      setIsOpen(false)
    }
  }

  if (!canDelete(permission?.roles)) {
    return null
  }

  return (
    <>
      <Button icon={<Trash2 />} iconPosition="left" variant="outline" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmationDialog open={isOpen} onOpenChange={setIsOpen} onConfirm={handleDelete} description={`This action cannot be undone, this will permanently remove the task from the organization.`} />
    </>
  )
}

export default DeleteTaskDialog

'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteTask } from '@/lib/graphql-hooks/tasks'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'

type TProps = {
  taskName: string
}

const DeleteTaskDialog: React.FC<TProps> = (props: TProps) => {
  const { selectedTask, setSelectedTask } = useTaskStore()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: deleteTask } = useDeleteTask()

  const handleDelete = async () => {
    if (!selectedTask) {
      return
    }

    try {
      await deleteTask({ deleteTaskId: selectedTask as string })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({ title: `Task deleted successfully.` })
      setSelectedTask(null)
      setIsOpen(false)
    } catch (error) {
      errorNotification({ title: 'Failed to delete task.' })
    }
  }

  return (
    <>
      <Button icon={<Trash2 />} iconPosition="left" variant="outline" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        description={`This action cannot be undone, this will permanently remove the task ${props.taskName} from the organization.`}
      />
    </>
  )
}

export default DeleteTaskDialog

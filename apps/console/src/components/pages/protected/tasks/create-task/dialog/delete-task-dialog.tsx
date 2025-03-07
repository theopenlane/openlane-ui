'use client'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useTaskStore } from '@/components/pages/protected/tasks/hooks/useTaskStore'
import { useQueryClient } from '@tanstack/react-query'
import { useDeleteTask } from '@/lib/graphql-hooks/tasks'

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Trash2 />} iconPosition="left" variant="outline">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete task</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 p-4 border border-destructive-border bg-[var(--color-destructive-transparent)] rounded-lg">
          <AlertTriangle className="text-destructive mt-1 flex-none" width={16} height={16} />
          <div>
            <p className="font-medium text-base text-destructive">Warning</p>
            <p className="text-sm text-destructive">Please proceed with caution, because you will not be able to undo this action.</p>
          </div>
        </div>
        <p>
          Are you sure you want to delete the task <span className="font-semibold">{props.taskName}</span> from your organization?
        </p>

        <DialogFooter className="flex gap-2 justify-start">
          <Button variant="destructive" onClick={handleDelete}>
            Delete this task
          </Button>
          <Button variant="outline" className="" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteTaskDialog

import { useNotification } from '@/hooks/useNotification'
import { useUpdateTask } from '@/lib/graphql-hooks/tasks'
import { TaskQuery, TaskTaskStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import React from 'react'

type MarkAsCompleteProps = {
  taskData: TaskQuery['task'] | undefined
}

const MarkAsComplete = ({ taskData }: MarkAsCompleteProps) => {
  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const queryClient = useQueryClient()
  const { mutateAsync: updateTask } = useUpdateTask()

  const handleMarkAsComplete = async () => {
    try {
      await updateTask({
        updateTaskId: id as string,
        input: {
          status: TaskTaskStatus.COMPLETED,
        },
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      successNotification({
        title: 'Task Updated',
        description: 'The task has been successfully marked as complete.',
      })
    } catch {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }
  return (
    <Button type="button" className="h-8 !px-2" disabled={taskData?.status === TaskTaskStatus.COMPLETED} icon={<Check />} iconPosition="left" variant="outline" onClick={() => handleMarkAsComplete()}>
      Mark as complete
    </Button>
  )
}

export default MarkAsComplete

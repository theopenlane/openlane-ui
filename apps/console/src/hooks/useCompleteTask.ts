'use client'

import { useCallback } from 'react'
import { TaskTaskStatus } from '@repo/codegen/src/schema'
import { useUpdateTask } from '@/lib/graphql-hooks/task'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const useCompleteTask = () => {
  const { mutateAsync: updateTask, isPending } = useUpdateTask()
  const { successNotification, errorNotification } = useNotification()

  const completeTask = useCallback(
    async (taskId: string) => {
      try {
        await updateTask({ updateTaskId: taskId, input: { status: TaskTaskStatus.COMPLETED } })
        successNotification({ title: 'Task Updated', description: 'The task has been successfully marked as complete.' })
        return true
      } catch (error) {
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
        return false
      }
    },
    [updateTask, successNotification, errorNotification],
  )

  return { completeTask, isCompleting: isPending }
}

import { useCallback } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { type TasksWithFilterQuery, type TaskTaskStatus, type TaskWhereInput } from '@repo/codegen/src/schema'
import { type TasksWithFilterNode, useUpdateTask } from '@/lib/graphql-hooks/task'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { getColumnQueryKey, type TaskBoardOrderBy } from '@/components/pages/protected/tasks/board/task-board-column-query'

type TasksInfiniteData = InfiniteData<TasksWithFilterQuery>

const withoutTask = (data: TasksInfiniteData, taskId: string): TasksInfiniteData => {
  const removed = data.pages.reduce((count, page) => count + (page.tasks.edges ?? []).filter((edge) => edge?.node?.id === taskId).length, 0)

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      tasks: { ...page.tasks, totalCount: page.tasks.totalCount - removed, edges: (page.tasks.edges ?? []).filter((edge) => edge?.node?.id !== taskId) },
    })),
  }
}

const withTaskFirst = (data: TasksInfiniteData, task: TasksWithFilterNode): TasksInfiniteData => ({
  ...data,
  pages: data.pages.map((page, index) => ({
    ...page,
    tasks: { ...page.tasks, totalCount: page.tasks.totalCount + 1, edges: index === 0 ? [{ node: task }, ...(page.tasks.edges ?? [])] : page.tasks.edges },
  })),
})

type UseMoveTaskStatusArgs = {
  whereFilter: TaskWhereInput | null
  orderByFilter: TaskBoardOrderBy
}

export const useMoveTaskStatus = ({ whereFilter, orderByFilter }: UseMoveTaskStatusArgs) => {
  const queryClient = useQueryClient()
  const { mutateAsync: updateTask } = useUpdateTask()
  const { successNotification, errorNotification } = useNotification()

  return useCallback(
    async (task: TasksWithFilterNode, to: TaskTaskStatus) => {
      if (!whereFilter) return

      const fromKey = getColumnQueryKey(whereFilter, orderByFilter, task.status)
      const toKey = getColumnQueryKey(whereFilter, orderByFilter, to)
      const affectedKeys = [fromKey, toKey]

      await Promise.all(affectedKeys.map((queryKey) => queryClient.cancelQueries({ queryKey, exact: true })))

      queryClient.setQueryData<TasksInfiniteData>(fromKey, (data) => data && withoutTask(data, task.id))
      queryClient.setQueryData<TasksInfiniteData>(toKey, (data) => data && withTaskFirst(data, { ...task, status: to }))

      try {
        await updateTask({ updateTaskId: task.id, input: { status: to } })
        successNotification({ title: 'Task updated', description: `${task.title} moved to ${getEnumLabel(to)}.` })
      } catch (error) {
        queryClient.setQueryData<TasksInfiniteData>(toKey, (data) => data && withoutTask(data, task.id))
        queryClient.setQueryData<TasksInfiniteData>(fromKey, (data) => data && withTaskFirst(data, task))
        await Promise.all(affectedKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey, exact: true })))
        errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      }
    },
    [whereFilter, orderByFilter, queryClient, updateTask, successNotification, errorNotification],
  )
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TASKS_WITH_FILTER, CREATE_TASK, UPDATE_TASK, DELETE_TASK, TASK, USER_TASKS, CREATE_CSV_BULK_TASK } from '@repo/codegen/query/tasks'
import {
  TasksWithFilterQuery,
  TasksWithFilterQueryVariables,
  CreateTaskMutation,
  CreateTaskMutationVariables,
  UpdateTaskMutation,
  UpdateTaskMutationVariables,
  DeleteTaskMutation,
  DeleteTaskMutationVariables,
  TaskQuery,
  TaskQueryVariables,
  CreateBulkCsvTaskMutation,
  CreateBulkCsvTaskMutationVariables,
  Task,
  TaskTaskStatus,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TaskStatusMapper } from '@/components/pages/protected/tasks/util/task.ts'
import { TPagination } from '@repo/ui/pagination-types'
import Pagination from '@repo/ui/pagination'

type GetAllTasksArgs = {
  where?: TasksWithFilterQueryVariables['where']
  orderBy?: TasksWithFilterQueryVariables['orderBy']
  pagination?: TPagination
}

export const useTasksWithFilter = ({ where, orderBy, pagination }: GetAllTasksArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<TasksWithFilterQuery, unknown>({
    queryKey: ['tasks', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () => client.request(TASKS_WITH_FILTER, { where, orderBy, ...pagination?.query }),
    enabled: Boolean(where || orderBy),
  })

  const tasks = (queryResult.data?.tasks?.edges?.map((edge) => {
    return {
      ...edge?.node,
      status: TaskStatusMapper[edge?.node?.status as TaskTaskStatus],
    }
  }) ?? []) as Task[]

  return { ...queryResult, tasks }
}

export const useCreateTask = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateTaskMutation, unknown, CreateTaskMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_TASK, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useUpdateTask = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateTaskMutation, unknown, UpdateTaskMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TASK, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useDeleteTask = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteTaskMutation, unknown, DeleteTaskMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_TASK, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useTask = (taskId?: TaskQueryVariables['taskId']) => {
  const { client } = useGraphQLClient()

  return useQuery<TaskQuery, unknown>({
    queryKey: ['task', taskId],
    queryFn: async () => client.request(TASK, { taskId }),
    enabled: !!taskId,
  })
}

export const useCreateBulkCSVTask = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvTaskMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_TASK, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

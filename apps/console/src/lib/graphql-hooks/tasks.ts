import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { TASKS_WITH_FILTER, CREATE_TASK, UPDATE_TASK, DELETE_TASK, TASK, CREATE_CSV_BULK_TASK } from '@repo/codegen/query/tasks'
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
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'

export const useTasksWithFilter = (where?: TasksWithFilterQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<TasksWithFilterQuery, unknown>({
    queryKey: ['tasks', where],
    queryFn: async () => client.request(TASKS_WITH_FILTER, { where }),
    enabled: where !== undefined,
  })
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

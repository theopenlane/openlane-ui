import { useQuery, useMutation, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
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
  Task,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { invalidateTaskAssociations } from '@/components/shared/objectAssociation/object-assoiation-config'

type GetAllTasksArgs = {
  where?: TasksWithFilterQueryVariables['where']
  orderBy?: TasksWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useTasksWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllTasksArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<TasksWithFilterQuery, unknown>({
    queryKey: ['tasks', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<TasksWithFilterQuery> => {
      const result = await client.request(TASKS_WITH_FILTER, { where, orderBy, ...pagination?.query })
      return result as TasksWithFilterQuery
    },
    enabled,
  })

  const tasks = (queryResult.data?.tasks?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Task[]

  return { ...queryResult, tasks }
}

export const useTasksWithFilterInfinite = ({ where, orderBy, pagination, enabled = true }: GetAllTasksArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useInfiniteQuery<TasksWithFilterQuery, Error, InfiniteData<TasksWithFilterQuery>>({
    initialPageParam: 1,
    queryKey: ['tasks', 'infinite', where, orderBy],
    queryFn: async (): Promise<TasksWithFilterQuery> => {
      const result = await client.request<TasksWithFilterQuery, TasksWithFilterQueryVariables>(TASKS_WITH_FILTER, {
        where,
        orderBy,
        ...pagination?.query,
      })
      return result as TasksWithFilterQuery
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.tasks?.pageInfo?.hasNextPage ? allPages.length + 1 : undefined),
    staleTime: Infinity,
    enabled,
  })

  const tasks: Task[] = queryResult.data?.pages.flatMap((page) => (page.tasks?.edges ?? []).map((edge) => edge?.node).filter((node): node is Task => node !== undefined)) ?? []

  const lastPage = queryResult.data?.pages.at(-1)

  const paginationMeta = {
    totalCount: lastPage?.tasks?.totalCount ?? 0,
    pageInfo: lastPage?.tasks?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    tasks,
    paginationMeta,
  }
}

export const useCreateTask = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateTaskMutation, unknown, CreateTaskMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_TASK, variables),
    onSuccess: (_, variables) => {
      invalidateTaskAssociations(variables, queryClient)
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
    queryKey: ['tasks', taskId],
    queryFn: async (): Promise<TaskQuery> => {
      const result = await client.request(TASK, { taskId })
      return result as TaskQuery
    },
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

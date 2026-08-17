import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  TASKS_WITH_FILTER,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
  TASK,
  CREATE_CSV_BULK_TASK,
  BULK_EDIT_TASK,
  UPDATE_TASK_COMMENT,
  BULK_DELETE_TASK,
  GET_OVERDUE_TASK_COUNT,
  GET_TASK_ASSOCIATIONS,
  TASK_TEMPLATES,
} from '@repo/codegen/query/task'
import {
  type TasksWithFilterQuery,
  type TasksWithFilterQueryVariables,
  type CreateTaskMutation,
  type CreateTaskMutationVariables,
  type UpdateTaskMutation,
  type UpdateTaskMutationVariables,
  type DeleteTaskMutation,
  type DeleteTaskMutationVariables,
  type TaskQuery,
  type TaskQueryVariables,
  type CreateBulkCsvTaskMutation,
  type CreateBulkCsvTaskMutationVariables,
  type UpdateBulkTaskMutation,
  type UpdateBulkTaskMutationVariables,
  type UpdateTaskCommentMutation,
  type UpdateTaskCommentMutationVariables,
  type DeleteBulkTaskMutation,
  type DeleteBulkTaskMutationVariables,
  type GetOverdueTaskCountQuery,
  type GetTaskAssociationsQuery,
  type GetTaskAssociationsQueryVariables,
  type TaskTemplatesQuery,
  type TaskTemplatesQueryVariables,
  type TaskWhereInput,
  OrderDirection,
  TaskOrderField,
} from '@repo/codegen/src/schema'
import { useMemo } from 'react'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import { invalidateTaskAssociations } from '@/components/shared/object-association/object-association-config'
import { resolveTasksWhere } from '@/lib/graphql-hooks/task-where'

type GetAllTasksArgs = {
  where?: TasksWithFilterQueryVariables['where']
  orderBy?: TasksWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
  includeTemplates?: boolean
}

export const useTasksWithFilter = ({ where, orderBy, pagination, enabled = true, includeTemplates }: GetAllTasksArgs) => {
  const { client } = useGraphQLClient()
  const effectiveWhere = resolveTasksWhere(where, includeTemplates)

  const queryResult = useQuery<TasksWithFilterQuery, unknown>({
    queryKey: ['tasks', effectiveWhere, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<TasksWithFilterQuery> => {
      const result = await client.request(TASKS_WITH_FILTER, { where: effectiveWhere, orderBy, ...pagination?.query })
      return result as TasksWithFilterQuery
    },
    enabled,
  })

  const tasks = useMemo(() => queryResult.data?.tasks?.edges?.map((edge) => edge?.node).filter((node): node is TasksWithFilterNode => !!node) ?? [], [queryResult.data])

  return { ...queryResult, tasks, isLoading: queryResult.isPending }
}

export type TasksWithFilterNode = NonNullable<NonNullable<NonNullable<NonNullable<TasksWithFilterQuery['tasks']>['edges']>[number]>['node']>

type GetInfiniteTasksArgs = {
  where: NonNullable<TasksWithFilterQueryVariables['where']>
  orderBy?: TasksWithFilterQueryVariables['orderBy']
  pageSize: number
  includeTemplates?: boolean
}

type TaskCursor = string | null

export const useTasksWithFilterInfinite = ({ where, orderBy, pageSize, includeTemplates }: GetInfiniteTasksArgs) => {
  const { client } = useGraphQLClient()
  const effectiveWhere = resolveTasksWhere(where, includeTemplates)

  const queryResult = useInfiniteQuery<TasksWithFilterQuery, Error, InfiniteData<TasksWithFilterQuery>, QueryKey, TaskCursor>({
    initialPageParam: null,
    queryKey: ['tasks', 'infinite', effectiveWhere, orderBy, pageSize],
    queryFn: async ({ pageParam }): Promise<TasksWithFilterQuery> => {
      const result = await client.request<TasksWithFilterQuery, TasksWithFilterQueryVariables>(TASKS_WITH_FILTER, {
        where: effectiveWhere,
        orderBy,
        first: pageSize,
        after: pageParam,
      })

      return result as TasksWithFilterQuery
    },
    getNextPageParam: (lastPage, _allPages, _lastPageParam, allPageParams) => {
      const pageInfo = lastPage.tasks?.pageInfo
      const nextCursor: TaskCursor = pageInfo?.endCursor ?? null

      if (!pageInfo?.hasNextPage || nextCursor == null || allPageParams.includes(nextCursor)) {
        return undefined
      }

      return nextCursor
    },
    staleTime: Infinity,
  })

  const pages = queryResult.data?.pages

  const tasks: TasksWithFilterNode[] = useMemo(() => {
    const nodes = pages?.flatMap((page) => (page.tasks?.edges ?? []).map((edge) => edge?.node).filter((node): node is TasksWithFilterNode => node != null)) ?? []

    return Array.from(new Map(nodes.map((task) => [task.id, task])).values())
  }, [pages])

  const paginationMeta = useMemo(() => {
    const lastPage = pages?.at(-1)

    return {
      totalCount: lastPage?.tasks?.totalCount ?? 0,
      pageInfo: { ...lastPage?.tasks?.pageInfo, hasNextPage: queryResult.hasNextPage },
      isLoading: queryResult.isFetching,
    }
  }, [pages, queryResult.hasNextPage, queryResult.isFetching])

  return {
    ...queryResult,
    tasks,
    paginationMeta,
    isLoading: queryResult.isPending,
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

export const useBulkEditTask = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkTaskMutation, unknown, UpdateBulkTaskMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_TASK, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useUpdateTaskComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTaskCommentMutation, unknown, UpdateTaskCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TASK_COMMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useBulkDeleteTask = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkTaskMutation, unknown, DeleteBulkTaskMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_TASK, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export const useGetOverdueTasksCount = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetOverdueTaskCountQuery, unknown>({
    queryKey: ['tasks', 'overdueTasksCount'],
    queryFn: async () =>
      client.request(GET_OVERDUE_TASK_COUNT, {
        now: new Date().toISOString(),
      }),
    enabled: true,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.tasks?.totalCount ?? 0,
  }
}

export type TaskTemplateNode = NonNullable<NonNullable<NonNullable<NonNullable<TaskTemplatesQuery['tasks']>['edges']>[number]>['node']>

const TASK_TEMPLATE_PAGE_SIZE = 20
const TASK_TEMPLATE_ORDER_BY = [{ field: TaskOrderField.updated_at, direction: OrderDirection.DESC }]
const TASK_TEMPLATE_STALE_TIME = 5 * 60 * 1000

export const useTaskTemplates = ({ searchTerm }: { searchTerm?: string }) => {
  const { client } = useGraphQLClient()

  const where: TaskWhereInput = { isTemplate: true, ...(searchTerm ? { titleContainsFold: searchTerm } : {}) }

  const queryResult = useQuery<TaskTemplatesQuery, unknown>({
    queryKey: ['tasks', 'templates', where],
    queryFn: async (): Promise<TaskTemplatesQuery> =>
      client.request<TaskTemplatesQuery, TaskTemplatesQueryVariables>(TASK_TEMPLATES, { where, orderBy: TASK_TEMPLATE_ORDER_BY, first: TASK_TEMPLATE_PAGE_SIZE }),
    staleTime: TASK_TEMPLATE_STALE_TIME,
  })

  const templates = useMemo(() => queryResult.data?.tasks?.edges?.map((edge) => edge?.node).filter((node): node is TaskTemplateNode => !!node) ?? [], [queryResult.data])

  return { ...queryResult, templates, totalCount: queryResult.data?.tasks?.totalCount ?? 0 }
}

export const useTaskAssociations = (taskId?: GetTaskAssociationsQueryVariables['taskId']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTaskAssociationsQuery, unknown>({
    queryKey: ['tasks', taskId, 'associations'],
    enabled: !!taskId,
    queryFn: async (): Promise<GetTaskAssociationsQuery> => {
      const result = await client.request(GET_TASK_ASSOCIATIONS, { taskId })
      return result as GetTaskAssociationsQuery
    },
  })
}

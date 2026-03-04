import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type DirectorySyncRunsWithFilterQuery,
  type DirectorySyncRunsWithFilterQueryVariables,
  type CreateDirectorySyncRunMutation,
  type CreateDirectorySyncRunMutationVariables,
  type UpdateDirectorySyncRunMutation,
  type UpdateDirectorySyncRunMutationVariables,
  type DeleteDirectorySyncRunMutation,
  type DeleteDirectorySyncRunMutationVariables,
  type DirectorySyncRunQuery,
  type DirectorySyncRunQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_DIRECTORY_SYNC_RUNS, CREATE_DIRECTORY_SYNC_RUN, UPDATE_DIRECTORY_SYNC_RUN, DELETE_DIRECTORY_SYNC_RUN, DIRECTORY_SYNC_RUN } from '@repo/codegen/query/directory-sync-run'

type GetAllDirectorySyncRunsArgs = {
  where?: DirectorySyncRunsWithFilterQueryVariables['where']
  orderBy?: DirectorySyncRunsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type DirectorySyncRunsNode = NonNullable<NonNullable<NonNullable<DirectorySyncRunsWithFilterQuery['directorySyncRuns']>['edges']>[number]>['node']

export type DirectorySyncRunsNodeNonNull = NonNullable<DirectorySyncRunsNode>

export const useDirectorySyncRunsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDirectorySyncRunsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<DirectorySyncRunsWithFilterQuery, unknown>({
    queryKey: ['directorySyncRuns', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DirectorySyncRunsWithFilterQuery> => {
      const result = await client.request<DirectorySyncRunsWithFilterQuery>(GET_ALL_DIRECTORY_SYNC_RUNS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.directorySyncRuns?.edges ?? []

  const directorySyncRunsNodes: DirectorySyncRunsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as DirectorySyncRunsNodeNonNull)

  return { ...queryResult, directorySyncRunsNodes }
}

export const useCreateDirectorySyncRun = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateDirectorySyncRunMutation, unknown, CreateDirectorySyncRunMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_DIRECTORY_SYNC_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directorySyncRuns'] })
    },
  })
}

export const useUpdateDirectorySyncRun = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateDirectorySyncRunMutation, unknown, UpdateDirectorySyncRunMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_DIRECTORY_SYNC_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directorySyncRuns'] })
    },
  })
}

export const useDeleteDirectorySyncRun = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteDirectorySyncRunMutation, unknown, DeleteDirectorySyncRunMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_DIRECTORY_SYNC_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directorySyncRuns'] })
    },
  })
}

export const useDirectorySyncRun = (directorySyncRunId?: DirectorySyncRunQueryVariables['directorySyncRunId']) => {
  const { client } = useGraphQLClient()
  return useQuery<DirectorySyncRunQuery, unknown>({
    queryKey: ['directorySyncRuns', directorySyncRunId],
    queryFn: async (): Promise<DirectorySyncRunQuery> => {
      const result = await client.request(DIRECTORY_SYNC_RUN, { directorySyncRunId })
      return result as DirectorySyncRunQuery
    },
    enabled: !!directorySyncRunId,
  })
}

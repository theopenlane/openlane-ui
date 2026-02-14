import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  DirectorySyncRun,
  DirectorySyncRunQuery,
  DirectorySyncRunQueryVariables,
  DirectorySyncRunsWithFilterQuery,
  DirectorySyncRunsWithFilterQueryVariables,
  CreateDirectorySyncRunMutation,
  CreateDirectorySyncRunMutationVariables,
  CreateBulkCsvDirectorySyncRunMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteDirectorySyncRunMutation,
  DeleteDirectorySyncRunMutationVariables,
  DeleteBulkDirectorySyncRunMutation,
  DeleteBulkDirectorySyncRunMutationVariables,
  UpdateDirectorySyncRunMutation,
  UpdateDirectorySyncRunMutationVariables,
  UpdateBulkDirectorySyncRunMutation,
  UpdateBulkDirectorySyncRunMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  DIRECTORY_SYNC_RUN,
  GET_ALL_DIRECTORY_SYNC_RUNS,
  BULK_DELETE_DIRECTORY_SYNC_RUN,
  CREATE_DIRECTORY_SYNC_RUN,
  CREATE_CSV_BULK_DIRECTORY_SYNC_RUN,
  DELETE_DIRECTORY_SYNC_RUN,
  UPDATE_DIRECTORY_SYNC_RUN,
  BULK_EDIT_DIRECTORY_SYNC_RUN,
} from '@repo/codegen/query/directory-sync-run'

type GetAllDirectorySyncRunsArgs = {
  where?: DirectorySyncRunsWithFilterQueryVariables['where']
  orderBy?: DirectorySyncRunsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useDirectorySyncRunsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDirectorySyncRunsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DirectorySyncRunsWithFilterQuery, unknown>({
    queryKey: ['directorySyncRuns', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DirectorySyncRunsWithFilterQuery> => {
      const result = await client.request(GET_ALL_DIRECTORY_SYNC_RUNS, { where, orderBy, ...pagination?.query })
      return result as DirectorySyncRunsWithFilterQuery
    },
    enabled,
  })

  const DirectorySyncRuns = (queryResult.data?.directorySyncRuns?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as DirectorySyncRun[]

  return { ...queryResult, DirectorySyncRuns }
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

export const useCreateBulkCSVDirectorySyncRun = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvDirectorySyncRunMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_DIRECTORY_SYNC_RUN, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directorySyncRuns'] })
    },
  })
}

export const useBulkEditDirectorySyncRun = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkDirectorySyncRunMutation, unknown, UpdateBulkDirectorySyncRunMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_DIRECTORY_SYNC_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directorySyncRuns'] })
    },
  })
}

export const useBulkDeleteDirectorySyncRun = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkDirectorySyncRunMutation, unknown, DeleteBulkDirectorySyncRunMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_DIRECTORY_SYNC_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directorySyncRuns'] })
    },
  })
}

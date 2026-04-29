import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type CheckResultsWithFilterQuery,
  type CheckResultsWithFilterQueryVariables,
  type CreateCheckResultMutation,
  type CreateCheckResultMutationVariables,
  type UpdateCheckResultMutation,
  type UpdateCheckResultMutationVariables,
  type DeleteCheckResultMutation,
  type DeleteCheckResultMutationVariables,
  type CheckResultQuery,
  type CheckResultQueryVariables,
  type CreateBulkCsvCheckResultMutation,
  type CreateBulkCsvCheckResultMutationVariables,
  type UpdateBulkCheckResultMutation,
  type UpdateBulkCheckResultMutationVariables,
  type DeleteBulkCheckResultMutation,
  type DeleteBulkCheckResultMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_CHECK_RESULTS,
  CREATE_CHECK_RESULT,
  UPDATE_CHECK_RESULT,
  DELETE_CHECK_RESULT,
  CHECK_RESULT,
  CREATE_CSV_BULK_CHECK_RESULT,
  BULK_EDIT_CHECK_RESULT,
  BULK_DELETE_CHECK_RESULT,
} from '@repo/codegen/query/check-result'

type GetAllCheckResultsArgs = {
  where?: CheckResultsWithFilterQueryVariables['where']
  orderBy?: CheckResultsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type CheckResultsNode = NonNullable<NonNullable<NonNullable<CheckResultsWithFilterQuery['checkResults']>['edges']>[number]>['node']

export type CheckResultsNodeNonNull = NonNullable<CheckResultsNode>

export const useCheckResultsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllCheckResultsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<CheckResultsWithFilterQuery, unknown>({
    queryKey: ['checkResults', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<CheckResultsWithFilterQuery> => {
      const result = await client.request<CheckResultsWithFilterQuery>(GET_ALL_CHECK_RESULTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.checkResults?.edges ?? []

  const checkResultsNodes: CheckResultsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as CheckResultsNodeNonNull)

  return { ...queryResult, checkResultsNodes }
}

export const useCreateCheckResult = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateCheckResultMutation, unknown, CreateCheckResultMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CHECK_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkResults'] })
    },
  })
}

export const useUpdateCheckResult = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateCheckResultMutation, unknown, UpdateCheckResultMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CHECK_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkResults'] })
    },
  })
}

export const useDeleteCheckResult = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteCheckResultMutation, unknown, DeleteCheckResultMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CHECK_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkResults'] })
    },
  })
}

export const useCheckResult = (checkResultId?: CheckResultQueryVariables['checkResultId']) => {
  const { client } = useGraphQLClient()
  return useQuery<CheckResultQuery, unknown>({
    queryKey: ['checkResults', checkResultId],
    queryFn: async (): Promise<CheckResultQuery> => {
      const result = await client.request(CHECK_RESULT, { checkResultId })
      return result as CheckResultQuery
    },
    enabled: !!checkResultId,
  })
}

export const useCreateBulkCSVCheckResult = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvCheckResultMutation, unknown, CreateBulkCsvCheckResultMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_CHECK_RESULT, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkResults'] })
    },
  })
}

export const useBulkEditCheckResult = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkCheckResultMutation, unknown, UpdateBulkCheckResultMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_CHECK_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkResults'] })
    },
  })
}

export const useBulkDeleteCheckResult = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkCheckResultMutation, unknown, DeleteBulkCheckResultMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_CHECK_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkResults'] })
    },
  })
}

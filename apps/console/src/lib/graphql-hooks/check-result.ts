import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type CheckResultsWithFilterQuery,
  type CheckResultsCountQuery,
  type CheckResultsCountQueryVariables,
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
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_CHECK_RESULTS,
  GET_CHECK_RESULTS_COUNT,
  CREATE_CHECK_RESULT,
  UPDATE_CHECK_RESULT,
  DELETE_CHECK_RESULT,
  CHECK_RESULT,
  CREATE_CSV_BULK_CHECK_RESULT,
  BULK_EDIT_CHECK_RESULT,
  BULK_DELETE_CHECK_RESULT,
} from '@repo/codegen/query/check-result'

export type CheckResultIncludeVars = Pick<CheckResultsWithFilterQueryVariables, 'includeFindings'>

type GetAllCheckResultsArgs = {
  where?: CheckResultsWithFilterQueryVariables['where']
  orderBy?: CheckResultsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
  includeVars?: CheckResultIncludeVars
}

export type CheckResultsNode = NonNullable<NonNullable<NonNullable<CheckResultsWithFilterQuery['checkResults']['edges']>[number]>['node']>

export const useCheckResultsWithFilter = ({ where, orderBy, pagination, enabled = true, includeVars }: GetAllCheckResultsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<CheckResultsWithFilterQuery>({
    queryKey: ['checkResults', where, orderBy, pagination?.page, pagination?.pageSize, includeVars],
    queryFn: () => client.request<CheckResultsWithFilterQuery, CheckResultsWithFilterQueryVariables>(GET_ALL_CHECK_RESULTS, { where, orderBy, ...includeVars, ...pagination?.query }),
    enabled,
  })

  const checkResultsNodes = getNodes(queryResult.data?.checkResults)

  return { ...queryResult, checkResultsNodes }
}

export const useCheckResultsCount = (where: CheckResultsCountQueryVariables['where'], enabled = true) => {
  const { client } = useGraphQLClient()
  return useQuery<CheckResultsCountQuery>({
    queryKey: ['checkResults', 'count', where],
    queryFn: () => client.request<CheckResultsCountQuery, CheckResultsCountQueryVariables>(GET_CHECK_RESULTS_COUNT, { where }),
    enabled,
  })
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

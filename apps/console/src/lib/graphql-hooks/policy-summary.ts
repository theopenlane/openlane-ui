import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type PolicySummariesWithFilterQuery,
  type PolicySummariesWithFilterQueryVariables,
  type CreatePolicySummaryMutation,
  type CreatePolicySummaryMutationVariables,
  type UpdatePolicySummaryMutation,
  type UpdatePolicySummaryMutationVariables,
  type DeletePolicySummaryMutation,
  type DeletePolicySummaryMutationVariables,
  type PolicySummaryQuery,
  type PolicySummaryQueryVariables,
  type UpdateBulkPolicySummaryMutation,
  type UpdateBulkPolicySummaryMutationVariables,
  type DeleteBulkPolicySummaryMutation,
  type DeleteBulkPolicySummaryMutationVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_POLICY_SUMMARIES,
  CREATE_POLICY_SUMMARY,
  UPDATE_POLICY_SUMMARY,
  DELETE_POLICY_SUMMARY,
  POLICY_SUMMARY,
  BULK_EDIT_POLICY_SUMMARY,
  BULK_DELETE_POLICY_SUMMARY,
} from '@repo/codegen/query/policy-summary'

type GetAllPolicySummariesArgs = {
  where?: PolicySummariesWithFilterQueryVariables['where']
  orderBy?: PolicySummariesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type PolicySummariesNode = NonNullable<NonNullable<NonNullable<PolicySummariesWithFilterQuery['policySummaries']>['edges']>[number]>['node']

export type PolicySummariesNodeNonNull = NonNullable<PolicySummariesNode>

export const usePolicySummariesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllPolicySummariesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<PolicySummariesWithFilterQuery, unknown>({
    queryKey: ['policySummaries', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<PolicySummariesWithFilterQuery> => {
      const result = await client.request<PolicySummariesWithFilterQuery>(GET_ALL_POLICY_SUMMARIES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.policySummaries?.edges ?? []

  const policySummariesNodes: PolicySummariesNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as PolicySummariesNodeNonNull)

  return { ...queryResult, policySummariesNodes }
}

export const useCreatePolicySummary = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreatePolicySummaryMutation, unknown, CreatePolicySummaryMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_POLICY_SUMMARY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policySummaries'] })
    },
  })
}

export const useUpdatePolicySummary = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdatePolicySummaryMutation, unknown, UpdatePolicySummaryMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_POLICY_SUMMARY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policySummaries'] })
    },
  })
}

export const useDeletePolicySummary = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeletePolicySummaryMutation, unknown, DeletePolicySummaryMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_POLICY_SUMMARY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policySummaries'] })
    },
  })
}

export const usePolicySummary = (policySummaryId?: PolicySummaryQueryVariables['policySummaryId']) => {
  const { client } = useGraphQLClient()
  return useQuery<PolicySummaryQuery, unknown>({
    queryKey: ['policySummaries', policySummaryId],
    queryFn: async (): Promise<PolicySummaryQuery> => {
      const result = await client.request(POLICY_SUMMARY, { policySummaryId })
      return result as PolicySummaryQuery
    },
    enabled: !!policySummaryId,
  })
}

export const useBulkEditPolicySummary = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkPolicySummaryMutation, unknown, UpdateBulkPolicySummaryMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_POLICY_SUMMARY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policySummaries'] })
    },
  })
}

export const useBulkDeletePolicySummary = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkPolicySummaryMutation, unknown, DeleteBulkPolicySummaryMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_POLICY_SUMMARY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policySummaries'] })
    },
  })
}

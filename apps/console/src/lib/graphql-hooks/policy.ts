import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_INTERNAL_POLICIES_LIST,
  GET_INTERNAL_POLICY_DETAILS_BY_ID,
  CREATE_INTERNAL_POLICY,
  UPDATE_INTERNAL_POLICY,
  SEARCH_INTERNAL_POLICIES,
  DELETE_INTERNAL_POLICY,
} from '@repo/codegen/query/policy'
import {
  CreateInternalPolicyMutation,
  CreateInternalPolicyMutationVariables,
  DeleteInternalPolicyMutation,
  DeleteInternalPolicyMutationVariables,
  GetInternalPoliciesListQuery,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
  SearchInternalPoliciesQuery,
  SearchInternalPoliciesQueryVariables,
  UpdateInternalPolicyMutation,
  UpdateInternalPolicyMutationVariables,
} from '@repo/codegen/src/schema'

export const useGetInternalPoliciesList = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies'],
    queryFn: async () => client.request(GET_INTERNAL_POLICIES_LIST),
  })
}

export const useGetInternalPolicyDetailsById = (internalPolicyId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPolicyDetailsByIdQuery, GetInternalPolicyDetailsByIdQueryVariables>({
    queryKey: ['internalPolicy', internalPolicyId],
    queryFn: async () => client.request(GET_INTERNAL_POLICY_DETAILS_BY_ID, { internalPolicyId }),
    enabled: !!internalPolicyId,
  })
}

export const useCreateInternalPolicy = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateInternalPolicyMutation, unknown, CreateInternalPolicyMutationVariables>({
    mutationFn: async (payload) => {
      return client.request(CREATE_INTERNAL_POLICY, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    },
  })
}

export const useUpdateInternalPolicy = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateInternalPolicyMutation, unknown, UpdateInternalPolicyMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(UPDATE_INTERNAL_POLICY, variables)
    },
  })
}

export const useSearchInternalPolicies = (searchQuery: string) => {
  const { client } = useGraphQLClient()

  return useQuery<SearchInternalPoliciesQuery>({
    queryKey: ['internalPoliciesSearch', searchQuery],
    queryFn: async () => {
      return client.request<SearchInternalPoliciesQuery, SearchInternalPoliciesQueryVariables>(SEARCH_INTERNAL_POLICIES, { query: searchQuery })
    },
    enabled: !!searchQuery,
  })
}

export const useDeleteInternalPolicy = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteInternalPolicyMutation, unknown, DeleteInternalPolicyMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(DELETE_INTERNAL_POLICY, variables)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internalPolicies'] }),
  })
}

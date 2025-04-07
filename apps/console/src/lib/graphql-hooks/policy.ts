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
  GetInternalPoliciesListQueryVariables,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
  InternalPolicy,
  SearchInternalPoliciesQuery,
  SearchInternalPoliciesQueryVariables,
  UpdateInternalPolicyMutation,
  UpdateInternalPolicyMutationVariables,
} from '@repo/codegen/src/schema'
import { useDebounce } from '../../../../../packages/ui/src/hooks/use-debounce'

export const useFilteredInternalPolicies = (searchQuery: string, where?: GetInternalPoliciesListQueryVariables['where'], orderBy?: GetInternalPoliciesListQueryVariables['orderBy']) => {
  const debouncedSearchTerm = useDebounce(searchQuery, 300)
  const { policies: allPolicies, isLoading: isFetchingAll, ...allQueryRest } = useGetInternalPoliciesList(where, orderBy)
  const { policies: searchPolicies, isLoading: isSearching, ...searchQueryRest } = useSearchInternalPolicies(debouncedSearchTerm)

  const showSearch = !!debouncedSearchTerm
  const policies = showSearch ? searchPolicies : allPolicies
  const isLoading = showSearch ? isSearching : isFetchingAll

  return {
    policies,
    isLoading,
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

export const useGetInternalPoliciesList = (where?: GetInternalPoliciesListQueryVariables['where'], orderBy?: GetInternalPoliciesListQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies', { where, orderBy }],
    queryFn: async () => client.request(GET_INTERNAL_POLICIES_LIST, { where, orderBy }),
  })

  const policies = (queryResult.data?.internalPolicies?.edges?.map((edge) => edge?.node) ?? []) as InternalPolicy[]

  return { ...queryResult, policies }
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

  const queryResult = useQuery<SearchInternalPoliciesQuery>({
    queryKey: ['internalPoliciesSearch', searchQuery],
    queryFn: async () => {
      return client.request<SearchInternalPoliciesQuery, SearchInternalPoliciesQueryVariables>(SEARCH_INTERNAL_POLICIES, { query: searchQuery })
    },
    enabled: !!searchQuery,
  })

  const policies = (queryResult.data?.internalPolicySearch?.internalPolicies ?? []) as InternalPolicy[]

  return { ...queryResult, policies }
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

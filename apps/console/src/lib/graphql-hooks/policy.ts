import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_INTERNAL_POLICIES_LIST,
  GET_INTERNAL_POLICY_DETAILS_BY_ID,
  CREATE_INTERNAL_POLICY,
  UPDATE_INTERNAL_POLICY,
  SEARCH_INTERNAL_POLICIES,
  DELETE_INTERNAL_POLICY,
  CREATE_CSV_BULK_INTERNAL_POLICY,
} from '@repo/codegen/query/policy'
import {
  CreateBulkCsvInternalPolicyMutation,
  CreateBulkCsvInternalPolicyMutationVariables,
  CreateBulkCsvTaskMutation,
  CreateBulkCsvTaskMutationVariables,
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
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { CREATE_CSV_BULK_TASK } from '@repo/codegen/query/tasks.ts'

type UseFilteredInternalPoliciesArgs = {
  where?: GetInternalPoliciesListQueryVariables['where']
  orderBy?: GetInternalPoliciesListQueryVariables['orderBy']
  pagination?: TPagination
  search: string
}

export const useFilteredInternalPolicies = ({ search, where, orderBy, pagination }: UseFilteredInternalPoliciesArgs) => {
  const debouncedSearchTerm = useDebounce(search, 300)

  const { policies: allPolicies, isLoading: isFetchingAll, data: allData, ...allQueryRest } = useGetInternalPoliciesList({ where, orderBy, pagination })

  const { policies: searchPoliciesRaw, isLoading: isSearching, data: searchData, ...searchQueryRest } = useSearchInternalPolicies({ search: debouncedSearchTerm, pagination })

  const showSearch = !!debouncedSearchTerm
  const isLoading = showSearch ? isSearching : isFetchingAll

  const filteredAndOrderedPolicies = showSearch ? allPolicies?.filter((policy) => searchPoliciesRaw?.some((searchPolicy) => searchPolicy.id === policy.id)) : allPolicies

  const paginationMeta = () => {
    if (!showSearch) {
      return {
        totalCount: allData?.internalPolicies?.totalCount ?? 0,
        pageInfo: allData?.internalPolicies?.pageInfo,
        isLoading,
      }
    }

    return {
      totalCount: searchData?.internalPolicySearch?.totalCount ?? 0,
      pageInfo: searchData?.internalPolicySearch?.pageInfo,
      isLoading,
    }
  }

  return {
    policies: filteredAndOrderedPolicies,
    isLoading,
    paginationMeta: paginationMeta(),
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

type GetInternalPoliciesListArgs = {
  where?: GetInternalPoliciesListQueryVariables['where']
  orderBy?: GetInternalPoliciesListQueryVariables['orderBy']
  pagination?: TPagination
}

export const useGetInternalPoliciesList = ({ where, orderBy, pagination }: GetInternalPoliciesListArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () => client.request(GET_INTERNAL_POLICIES_LIST, { where, orderBy, ...pagination?.query }),
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

type searchInternalPoliciesArgs = {
  search: string
  pagination?: TPagination
}

export const useSearchInternalPolicies = ({ search, pagination }: searchInternalPoliciesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchInternalPoliciesQuery>({
    queryKey: ['internalPolicies', 'search', search, pagination?.page, pagination?.pageSize],
    queryFn: async () => {
      return client.request<SearchInternalPoliciesQuery, SearchInternalPoliciesQueryVariables>(SEARCH_INTERNAL_POLICIES, { query: search, ...pagination?.query })
    },
    enabled: !!search,
  })

  const policies = (queryResult.data?.internalPolicySearch ?? []) as InternalPolicy[]

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

export const useCreateBulkCSVInternalPolicy = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvInternalPolicyMutation, unknown, CreateBulkCsvInternalPolicyMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_INTERNAL_POLICY, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    },
  })
}

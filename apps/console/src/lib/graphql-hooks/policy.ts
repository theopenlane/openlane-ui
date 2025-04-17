import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_INTERNAL_POLICIES_LIST,
  GET_INTERNAL_POLICY_DETAILS_BY_ID,
  CREATE_INTERNAL_POLICY,
  UPDATE_INTERNAL_POLICY,
  DELETE_INTERNAL_POLICY,
  CREATE_CSV_BULK_INTERNAL_POLICY,
} from '@repo/codegen/query/policy'
import {
  CreateBulkCsvInternalPolicyMutation,
  CreateBulkCsvInternalPolicyMutationVariables,
  CreateInternalPolicyMutation,
  CreateInternalPolicyMutationVariables,
  DeleteInternalPolicyMutation,
  DeleteInternalPolicyMutationVariables,
  GetInternalPoliciesListQuery,
  GetInternalPoliciesListQueryVariables,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
  InternalPolicy,
  UpdateInternalPolicyMutation,
  UpdateInternalPolicyMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

type UseInternalPoliciesArgs = {
  where?: GetInternalPoliciesListQueryVariables['where']
  orderBy?: GetInternalPoliciesListQueryVariables['orderBy']
  pagination?: TPagination
}

export const useInternalPolicies = ({ where, orderBy, pagination }: UseInternalPoliciesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_INTERNAL_POLICIES_LIST, {
        where,
        orderBy,
        ...pagination?.query,
      }),
  })

  const policies = (queryResult.data?.internalPolicies?.edges ?? []).map((edge) => edge?.node) as InternalPolicy[]

  const paginationMeta = {
    totalCount: queryResult.data?.internalPolicies?.totalCount ?? 0,
    pageInfo: queryResult.data?.internalPolicies?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    policies,
    paginationMeta,
    isLoading: queryResult.isFetching,
  }
}

export const useGetInternalPolicyDetailsById = (internalPolicyId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPolicyDetailsByIdQuery, GetInternalPolicyDetailsByIdQueryVariables>({
    queryKey: ['internalPolicies', internalPolicyId],
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

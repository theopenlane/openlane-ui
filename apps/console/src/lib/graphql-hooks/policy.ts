import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_INTERNAL_POLICIES_LIST,
  GET_INTERNAL_POLICY_DETAILS_BY_ID,
  CREATE_INTERNAL_POLICY,
  UPDATE_INTERNAL_POLICY,
  DELETE_INTERNAL_POLICY,
  CREATE_CSV_BULK_INTERNAL_POLICY,
  BULK_EDIT_INTERNAL_POLICY,
  CREATE_UPLOAD_POLICY,
} from '@repo/codegen/query/policy'
import {
  CreateBulkCsvInternalPolicyMutation,
  CreateBulkCsvInternalPolicyMutationVariables,
  CreateInternalPolicyMutation,
  CreateInternalPolicyMutationVariables,
  CreateUploadInternalPolicyMutation,
  CreateUploadInternalPolicyMutationVariables,
  DeleteInternalPolicyMutation,
  DeleteInternalPolicyMutationVariables,
  GetInternalPoliciesListQuery,
  GetInternalPoliciesListQueryVariables,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
  InternalPolicy,
  UpdateBulkInternalPolicyMutation,
  UpdateBulkInternalPolicyMutationVariables,
  UpdateInternalPolicyMutation,
  UpdateInternalPolicyMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

type UseInternalPoliciesArgs = {
  where?: GetInternalPoliciesListQueryVariables['where']
  orderBy?: GetInternalPoliciesListQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useInternalPolicies = ({ where, orderBy, pagination, enabled }: UseInternalPoliciesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_INTERNAL_POLICIES_LIST, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
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

export const usePolicySelect = () => {
  const { data, ...rest } = useInternalPolicies({
    where: {},
    enabled: true,
  })

  const policyOptions = data?.internalPolicies?.edges?.flatMap((edge) => (edge?.node?.id && edge?.node?.name ? [{ label: edge.node.name, value: edge.node.id }] : [])) ?? []

  return { policyOptions, ...rest }
}

export const useGetInternalPolicyDetailsById = (internalPolicyId: string | null, enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPolicyDetailsByIdQuery, GetInternalPolicyDetailsByIdQueryVariables>({
    queryKey: ['internalPolicies', internalPolicyId],
    queryFn: async () => client.request(GET_INTERNAL_POLICY_DETAILS_BY_ID, { internalPolicyId }),
    enabled: !!internalPolicyId && enabled,
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

export const useBulkEditInternalPolicy = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkInternalPolicyMutation, unknown, UpdateBulkInternalPolicyMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_INTERNAL_POLICY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
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

export const useCreateUploadInternalPolicy = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateUploadInternalPolicyMutation, unknown, CreateUploadInternalPolicyMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_UPLOAD_POLICY, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    },
  })
}

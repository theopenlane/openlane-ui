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
  GET_INTERNAL_POLICIES_DASHBOARD,
  GET_POLICY_SUGGESTED_ACTIONS,
  BULK_DELETE_POLICY,
  GET_INTERNAL_POLICY_ASSOCIATIONS_BY_ID,
  INSERT_POLICY_COMMENT,
  GET_POLICY_DISCUSSION_BY_ID,
  UPDATE_POLICY_COMMENT,
} from '@repo/codegen/query/internal-policy'
import {
  CreateBulkCsvInternalPolicyMutation,
  CreateBulkCsvInternalPolicyMutationVariables,
  CreateInternalPolicyMutation,
  CreateInternalPolicyMutationVariables,
  CreateUploadInternalPolicyMutation,
  CreateUploadInternalPolicyMutationVariables,
  DeleteBulkInternalPolicyMutation,
  DeleteBulkInternalPolicyMutationVariables,
  DeleteInternalPolicyMutation,
  DeleteInternalPolicyMutationVariables,
  GetInternalPoliciesDashboardQuery,
  GetInternalPoliciesListQuery,
  GetInternalPoliciesListQueryVariables,
  GetInternalPolicyAssociationsByIdQuery,
  GetInternalPolicyAssociationsByIdQueryVariables,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
  GetPolicyDiscussionByIdQuery,
  InternalPolicy,
  PolicySuggestedActionsQuery,
  UpdateBulkInternalPolicyMutation,
  UpdateBulkInternalPolicyMutationVariables,
  InsertInternalPolicyCommentMutation,
  InsertInternalPolicyCommentMutationVariables,
  UpdateInternalPolicyMutation,
  UpdateInternalPolicyMutationVariables,
  UpdatePolicyCommentMutation,
  UpdatePolicyCommentMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { useSession } from 'next-auth/react'
import { wherePoliciesDashboard } from '@/components/pages/protected/policies/policies-dashboard/dashboard-config.ts'

type UseInternalPoliciesArgs = {
  where?: GetInternalPoliciesListQueryVariables['where']
  orderBy?: GetInternalPoliciesListQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useInternalPoliciesCount = (pagination: TPagination) => {
  const { client } = useGraphQLClient()
  const where = {
    ...wherePoliciesDashboard,
  }

  const queryResult = useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies', where, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_INTERNAL_POLICIES_LIST, {
        where,
        ...pagination?.query,
      }),
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.internalPolicies?.totalCount ?? 0,
    isLoading: queryResult.isFetching,
  }
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

export const useGetInternalPolicyAssociationsById = (internalPolicyId: string | null, enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPolicyAssociationsByIdQuery, GetInternalPolicyAssociationsByIdQueryVariables>({
    queryKey: ['internalPolicies', internalPolicyId, 'associations'],
    queryFn: async () =>
      client.request(GET_INTERNAL_POLICY_ASSOCIATIONS_BY_ID, {
        internalPolicyId,
      }),
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

type UseInternalPoliciesDashboardArgs = {
  where?: GetInternalPoliciesListQueryVariables['where']
  enabled?: boolean
}

export const useInternalPoliciesDashboard = ({ where, enabled = true }: UseInternalPoliciesDashboardArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetInternalPoliciesDashboardQuery>({
    queryKey: ['internalPolicies', 'dashboard', where],
    queryFn: () =>
      client.request(GET_INTERNAL_POLICIES_DASHBOARD, {
        where,
      }),
    enabled,
  })

  const policies = (queryResult.data?.internalPolicies?.edges ?? []).map((edge) => edge?.node) as InternalPolicy[]

  return {
    ...queryResult,
    policies,
    isLoading: queryResult.isFetching,
  }
}

export const usePolicySuggestedActions = () => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()

  const currentUserId = session?.user?.userId
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const commentsSince = sevenDaysAgo

  return useQuery<PolicySuggestedActionsQuery>({
    queryKey: ['internalPolicies', 'suggested-actions', currentUserId],
    queryFn: async () =>
      client.request(GET_POLICY_SUGGESTED_ACTIONS, {
        currentUserIdID: currentUserId,
        currentUserIdString: currentUserId,
        sevenDaysAgo,
        commentsSince,
      }),
    enabled: !!currentUserId,
    refetchOnWindowFocus: false,
  })
}

export const useBulkDeletePolicy = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkInternalPolicyMutation, unknown, DeleteBulkInternalPolicyMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_POLICY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    },
  })
}

export const POLICY_DISCUSSION_QUERY_KEY = 'policyDiscussion'

export const useGetPolicyDiscussionById = (policyId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetPolicyDiscussionByIdQuery, unknown>({
    queryKey: [POLICY_DISCUSSION_QUERY_KEY, policyId],
    queryFn: async () => client.request(GET_POLICY_DISCUSSION_BY_ID, { policyId }),
    enabled: !!policyId,
  })
}

export const useInsertPolicyComment = () => {
  const { client } = useGraphQLClient()

  return useMutation<InsertInternalPolicyCommentMutation, unknown, InsertInternalPolicyCommentMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(INSERT_POLICY_COMMENT, variables)
    },
  })
}

export const useUpdatePolicyComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdatePolicyCommentMutation, unknown, UpdatePolicyCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_POLICY_COMMENT, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['policyComments', data.updateInternalPolicyComment.internalPolicy.id] })
    },
  })
}

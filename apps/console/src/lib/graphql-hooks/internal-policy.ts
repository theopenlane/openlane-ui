import { useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, type InfiniteData } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useHistoryGraphQLClient } from '@/hooks/useHistoryGraphQLClient'
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
  GET_POLICY_COMMENTS_BY_ID,
} from '@repo/codegen/query/internal-policy'
import { GET_INTERNAL_POLICY_HISTORIES } from '@repo/codegen/query-history/internal-policy'
import { type GetInternalPolicyHistoriesQuery, type GetInternalPolicyHistoriesQueryVariables, InternalPolicyHistoryOrderField, OrderDirection } from '@repo/codegen/src/historyschema'
import {
  type CreateBulkCsvInternalPolicyMutation,
  type CreateBulkCsvInternalPolicyMutationVariables,
  type CreateInternalPolicyMutation,
  type CreateInternalPolicyMutationVariables,
  type CreateUploadInternalPolicyMutation,
  type CreateUploadInternalPolicyMutationVariables,
  type DeleteBulkInternalPolicyMutation,
  type DeleteBulkInternalPolicyMutationVariables,
  type DeleteInternalPolicyMutation,
  type DeleteInternalPolicyMutationVariables,
  type GetInternalPoliciesDashboardQuery,
  type GetInternalPoliciesListQuery,
  type GetInternalPoliciesListQueryVariables,
  type GetInternalPolicyAssociationsByIdQuery,
  type GetInternalPolicyAssociationsByIdQueryVariables,
  type GetInternalPolicyDetailsByIdQuery,
  type GetInternalPolicyDetailsByIdQueryVariables,
  type GetPolicyDiscussionByIdQuery,
  type InternalPolicy,
  type PolicySuggestedActionsQuery,
  type UpdateBulkInternalPolicyMutation,
  type UpdateBulkInternalPolicyMutationVariables,
  type InsertInternalPolicyCommentMutation,
  type InsertInternalPolicyCommentMutationVariables,
  type UpdateInternalPolicyMutation,
  type UpdateInternalPolicyMutationVariables,
  type UpdatePolicyCommentMutation,
  type UpdatePolicyCommentMutationVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { useSession } from 'next-auth/react'
import { subDays } from 'date-fns'
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
    isLoading: queryResult.isLoading,
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
    isLoading: queryResult.isLoading,
  }

  return {
    ...queryResult,
    policies,
    paginationMeta,
    isLoading: queryResult.isLoading,
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
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateInternalPolicyMutation, unknown, UpdateInternalPolicyMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(UPDATE_INTERNAL_POLICY, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policyDiscussion'] })
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      queryClient.invalidateQueries({ queryKey: ['internalPolicyHistories'] })
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
    isLoading: queryResult.isLoading,
  }
}

export const usePolicySuggestedActions = () => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()

  const currentUserId = session?.user?.userId

  return useQuery<PolicySuggestedActionsQuery>({
    queryKey: ['internalPolicies', 'suggested-actions', currentUserId],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString()
      return client.request(GET_POLICY_SUGGESTED_ACTIONS, {
        currentUserIdID: currentUserId,
        currentUserIdString: currentUserId,
        sevenDaysAgo,
        commentsSince: sevenDaysAgo,
      })
    },
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

export const useGetPolicyDiscussionById = (policyId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetPolicyDiscussionByIdQuery, unknown>({
    queryKey: ['policyDiscussion', policyId],
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

type PolicyCommentsQuery = {
  internalPolicy: {
    id: string
    comments: {
      edges: Array<{
        node: {
          id: string
          createdAt: string | null
          createdBy: string | null
          text: string | null
        } | null
      } | null> | null
    }
  }
}

export const useGetPolicyCommentsById = (policyId: string | null | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<PolicyCommentsQuery>({
    queryKey: ['policyComments', policyId],
    queryFn: async () => client.request(GET_POLICY_COMMENTS_BY_ID, { policyId }),
    enabled: !!policyId,
  })
}

const HISTORY_ORDER_BY = { field: InternalPolicyHistoryOrderField.history_time, direction: OrderDirection.DESC }
const HISTORY_PAGE_SIZE = 20

type HistoriesPage = GetInternalPolicyHistoriesQuery['internalPolicyHistories']
type HistoryEdge = NonNullable<NonNullable<HistoriesPage['edges']>[number]>
type HistoryNodeShape = NonNullable<HistoryEdge['node']>

export const useGetInternalPolicyHistories = (policyId: string | null | undefined, enabled = true) => {
  const { client } = useHistoryGraphQLClient()
  const where = useMemo(() => ({ ref: policyId, revisionHasSuffix: '.0' }), [policyId])

  const queryResult = useInfiniteQuery<GetInternalPolicyHistoriesQuery, Error, InfiniteData<GetInternalPolicyHistoriesQuery>, readonly unknown[], string | null>({
    queryKey: ['internalPolicyHistories', policyId, where, HISTORY_ORDER_BY, HISTORY_PAGE_SIZE],
    initialPageParam: null,
    queryFn: ({ pageParam }) =>
      client.request<GetInternalPolicyHistoriesQuery, GetInternalPolicyHistoriesQueryVariables>(GET_INTERNAL_POLICY_HISTORIES, {
        where,
        orderBy: HISTORY_ORDER_BY,
        first: HISTORY_PAGE_SIZE,
        after: pageParam ?? null,
      }),
    getNextPageParam: (last) => (last.internalPolicyHistories.pageInfo.hasNextPage ? (last.internalPolicyHistories.pageInfo.endCursor ?? null) : undefined),
    enabled: !!policyId && enabled,
  })

  const historyNodes = useMemo<HistoryNodeShape[]>(() => {
    const pages = queryResult.data?.pages ?? []
    return pages.flatMap((p) => (p.internalPolicyHistories.edges ?? []).map((e) => e?.node).filter((n): n is HistoryNodeShape => n != null))
  }, [queryResult.data])

  const lastPage = queryResult.data?.pages.at(-1)
  const paginationMeta = {
    totalCount: lastPage?.internalPolicyHistories.totalCount ?? 0,
    pageInfo: lastPage?.internalPolicyHistories.pageInfo,
    isLoading: queryResult.isLoading || queryResult.isFetchingNextPage,
  }

  return {
    ...queryResult,
    historyNodes,
    paginationMeta,
  }
}

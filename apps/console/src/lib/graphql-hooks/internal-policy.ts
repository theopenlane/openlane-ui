import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useModuleGatedQuery } from '@/lib/graphql-hooks/use-module-gated-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useInfiniteQuery, useMutation, useQuery, type InfiniteData } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useHistoryGraphQLClient } from '@/hooks/useHistoryGraphQLClient'
import {
  GET_INTERNAL_POLICIES_LIST,
  GET_INTERNAL_POLICY_NAMES,
  SEARCH_INTERNAL_POLICY_DOCUMENTS,
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
  ADD_POLICY_COMMENT,
  GET_POLICY_COMMENT_COUNT,
  GET_INTERNAL_POLICY_ACTIVITY,
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
  type SearchInternalPolicyDocumentsQuery,
  type SearchInternalPolicyDocumentsQueryVariables,
  type UpdateBulkInternalPolicyMutation,
  type UpdateBulkInternalPolicyMutationVariables,
  type InsertInternalPolicyCommentMutation,
  type InsertInternalPolicyCommentMutationVariables,
  type UpdateInternalPolicyMutation,
  type UpdateInternalPolicyMutationVariables,
  type UpdatePolicyCommentMutation,
  type UpdatePolicyCommentMutationVariables,
  type InternalPolicyActivityQuery,
  type InternalPolicyActivityQueryVariables,
  type GetPolicyCommentsByIdQuery,
  type GetPolicyCommentsByIdQueryVariables,
  type AddPolicyCommentMutation,
  type AddPolicyCommentMutationVariables,
  type GetPolicyCommentCountQuery,
  type GetPolicyCommentCountQueryVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@theopenlane/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { useSession } from 'next-auth/react'
import { useEntityComments } from '@/lib/graphql-hooks/entity-comments'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'
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
    isLoading: queryResult.isPending,
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
    isLoading: queryResult.isPending,
  }

  return {
    ...queryResult,
    policies,
    paginationMeta,
    isLoading: queryResult.isPending,
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

export const useCreateInternalPolicy = ({ autoInvalidate = true }: { autoInvalidate?: boolean } = {}) => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateInternalPolicyMutation, unknown, CreateInternalPolicyMutationVariables>({
    mutationFn: async (payload) => {
      return client.request(CREATE_INTERNAL_POLICY, payload)
    },
    onSuccess: () => {
      if (autoInvalidate) {
        queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      }
    },
  })
}

export const useUpdateInternalPolicy = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateInternalPolicyMutation, unknown, UpdateInternalPolicyMutationVariables>({
    mutationFn: async (variables) => {
      if (variables.internalPolicyFile instanceof File) {
        return fetchGraphQLWithUpload({ query: UPDATE_INTERNAL_POLICY, variables })
      }
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

export const useCreateUploadInternalPolicy = ({ autoInvalidate = true }: { autoInvalidate?: boolean } = {}) => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateUploadInternalPolicyMutation, unknown, CreateUploadInternalPolicyMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_UPLOAD_POLICY, variables }),
    onSuccess: () => {
      if (autoInvalidate) {
        queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      }
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

const POLICY_COMMENTS_KEY = 'policyComments'
const POLICY_DISCUSSION_KEY = 'policyDiscussion'

export const useGetPolicyDiscussionById = (policyId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetPolicyDiscussionByIdQuery, unknown>({
    queryKey: [POLICY_DISCUSSION_KEY, policyId],
    queryFn: async () => client.request(GET_POLICY_DISCUSSION_BY_ID, { policyId }),
    enabled: !!policyId,
  })
}

export const useInsertPolicyComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<InsertInternalPolicyCommentMutation, unknown, InsertInternalPolicyCommentMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(INSERT_POLICY_COMMENT, variables)
    },
    onSuccess: (_, { updateInternalPolicyId }) => {
      queryClient.invalidateQueries({ queryKey: [POLICY_DISCUSSION_KEY, updateInternalPolicyId] })
    },
  })
}

export const useUpdatePolicyComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdatePolicyCommentMutation, unknown, UpdatePolicyCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_POLICY_COMMENT, variables),
    onSuccess: (data) => {
      const policyId = data.updateInternalPolicyComment.internalPolicy.id
      queryClient.invalidateQueries({ queryKey: [POLICY_COMMENTS_KEY, policyId] })
      queryClient.invalidateQueries({ queryKey: [POLICY_DISCUSSION_KEY, policyId] })
    },
  })
}

const attachPolicyCommentFiles = (commentId: string, files: File[]) =>
  fetchGraphQLWithUpload<UpdatePolicyCommentMutationVariables>({
    query: UPDATE_POLICY_COMMENT,
    variables: { updateInternalPolicyCommentId: commentId, input: {}, noteFiles: files },
  })

export const usePolicyComments = (policyId: string | null | undefined) => {
  const { data: session } = useSession()
  const commenterId = session?.user?.userId

  return useEntityComments({
    queryKeyPrefix: POLICY_COMMENTS_KEY,
    entityId: policyId,
    fetchComments: async (client, id) => (await client.request<GetPolicyCommentsByIdQuery, GetPolicyCommentsByIdQueryVariables>(GET_POLICY_COMMENTS_BY_ID, { policyId: id })).internalPolicy.comments,
    addComment: async (client, id, text, withCommentId) => {
      if (withCommentId && !commenterId) throw new UserFacingError('Your session is still loading. Please try again.')
      const data = await client.request<AddPolicyCommentMutation, AddPolicyCommentMutationVariables>(ADD_POLICY_COMMENT, {
        updateInternalPolicyId: id,
        input: { addComment: { text } },
        commenterId,
        withCommentId,
      })
      return getNodes(data.updateInternalPolicy.internalPolicy.comments)[0]?.id
    },
    editComment: (client, commentId, text) =>
      client.request<UpdatePolicyCommentMutation, UpdatePolicyCommentMutationVariables>(UPDATE_POLICY_COMMENT, { updateInternalPolicyCommentId: commentId, input: { text } }),
    attachFiles: attachPolicyCommentFiles,
  })
}

export const usePolicyCommentCount = (policyId: string) => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: [POLICY_COMMENTS_KEY, policyId, 'count'],
    queryFn: () => client.request<GetPolicyCommentCountQuery, GetPolicyCommentCountQueryVariables>(GET_POLICY_COMMENT_COUNT, { policyId }),
    select: (data) => data.internalPolicy.comments.totalCount,
    enabled: !!policyId,
    placeholderData: undefined,
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

  const rawHistoryNodes = useMemo<HistoryNodeShape[]>(() => {
    const pages = queryResult.data?.pages ?? []
    return pages.flatMap((p) => (p.internalPolicyHistories.edges ?? []).map((e) => e?.node).filter((n): n is HistoryNodeShape => n != null))
  }, [queryResult.data])

  const historyNodes = useMemo<HistoryNodeShape[]>(() => {
    const byRevision = new Map<string, HistoryNodeShape>()
    for (const node of rawHistoryNodes) {
      if (!node.revision) continue
      const existing = byRevision.get(node.revision)
      if (!existing || (node.historyTime && existing.historyTime && node.historyTime < existing.historyTime)) {
        byRevision.set(node.revision, node)
      }
    }
    return Array.from(byRevision.values()).sort((a, b) => (b.historyTime ?? '').localeCompare(a.historyTime ?? ''))
  }, [rawHistoryNodes])

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

export type TPolicyNameSummary = { id: string; name: string; summary?: string | null }

type PolicyNamesPage = {
  internalPolicies: {
    totalCount: number
    pageInfo: { endCursor?: string | null; hasNextPage: boolean }
    edges?: Array<{ node?: TPolicyNameSummary | null } | null> | null
  }
}

const POLICY_NAMES_PAGE_SIZE = 100

// name and summary for every policy in the org, paged through in full
export const useAllPolicyNames = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { client } = useGraphQLClient()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isPlaceholderData, isError } = useInfiniteQuery<
    PolicyNamesPage,
    Error,
    InfiniteData<PolicyNamesPage>,
    ['internalPolicies', 'names'],
    string | null
  >({
    queryKey: ['internalPolicies', 'names'],
    queryFn: async ({ pageParam }) => client.request(GET_INTERNAL_POLICY_NAMES, { after: pageParam, first: POLICY_NAMES_PAGE_SIZE }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.internalPolicies.pageInfo.hasNextPage ? (lastPage.internalPolicies.pageInfo.endCursor ?? null) : undefined),
    enabled,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const policies = useMemo(() => (data?.pages ?? []).flatMap((page) => (page.internalPolicies.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))), [data])

  return { policies, isLoading: enabled && (isPending || isPlaceholderData || hasNextPage || isFetchingNextPage), isError: enabled && isError }
}

export type TInternalPolicyDocument = NonNullable<NonNullable<NonNullable<SearchInternalPolicyDocumentsQuery['internalPolicies']['edges']>[number]>['node']>

const POLICY_DOCUMENT_SEARCH_LIMIT = 20

export const useSearchInternalPolicyDocuments = ({ search, enabled = true }: { search: string; enabled?: boolean }) => {
  const { client } = useGraphQLClient()
  const where = search ? { nameContainsFold: search } : {}

  const query = useQuery<SearchInternalPolicyDocumentsQuery, Error>({
    queryKey: ['internalPolicies', 'documents', where],
    queryFn: () => client.request<SearchInternalPolicyDocumentsQuery, SearchInternalPolicyDocumentsQueryVariables>(SEARCH_INTERNAL_POLICY_DOCUMENTS, { where, first: POLICY_DOCUMENT_SEARCH_LIMIT }),
    enabled,
  })

  return { ...query, policies: getNodes(query.data?.internalPolicies), totalCount: query.data?.internalPolicies.totalCount ?? 0 }
}

export const useInternalPolicyDocumentsByIds = (ids: string[]) => {
  const { client } = useGraphQLClient()
  const where = { idIn: ids }

  const query = useQuery<SearchInternalPolicyDocumentsQuery, Error>({
    queryKey: ['internalPolicies', 'documents', where],
    queryFn: () => client.request<SearchInternalPolicyDocumentsQuery, SearchInternalPolicyDocumentsQueryVariables>(SEARCH_INTERNAL_POLICY_DOCUMENTS, { where, first: ids.length }),
    enabled: ids.length > 0,
  })

  return { ...query, policies: getNodes(query.data?.internalPolicies) }
}

// useFetchInternalPolicyDocument fetches the current revision, management mode and file of a policy
export const useFetchInternalPolicyDocument = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    async (policyId: string, signal?: AbortSignal): Promise<TInternalPolicyDocument | null> => {
      const data = await client.request<SearchInternalPolicyDocumentsQuery, SearchInternalPolicyDocumentsQueryVariables>({
        document: SEARCH_INTERNAL_POLICY_DOCUMENTS,
        variables: { where: { id: policyId }, first: 1 },
        signal,
      })
      return getNodes(data.internalPolicies)[0] ?? null
    },
    [client],
  )
}

export const useFetchInternalPolicyRevision = () => {
  const fetchPolicyDocument = useFetchInternalPolicyDocument()

  return useCallback(async (policyId: string, signal?: AbortSignal) => (await fetchPolicyDocument(policyId, signal))?.revision ?? null, [fetchPolicyDocument])
}

export const useInternalPolicyActivity = ({ enabled, ...variables }: InternalPolicyActivityQueryVariables & { enabled?: boolean }) => {
  const { client } = useGraphQLClient()
  const { data, isLoading } = useModuleGatedQuery({
    objectType: ObjectTypes.INTERNAL_POLICY,
    queryKey: ['internalPolicies', 'activity', variables],
    queryFn: () => client.request<InternalPolicyActivityQuery, InternalPolicyActivityQueryVariables>(GET_INTERNAL_POLICY_ACTIVITY, variables),
    enabled,
  })
  const internalPolicies = useMemo(() => getNodes(data?.internalPolicies), [data])

  return { internalPolicies, totalCount: data?.internalPolicies?.totalCount ?? 0, isLoading }
}

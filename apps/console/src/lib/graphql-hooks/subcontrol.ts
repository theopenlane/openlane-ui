import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_SUBCONTROL,
  DELETE_SUBCONTROL,
  GET_ALL_SUBCONTROLS,
  GET_SUBCONTROL_ASSOCIATIONS_BY_ID,
  GET_SUBCONTROL_BY_ID,
  GET_SUBCONTROL_BY_ID_MINIFIED,
  GET_SUBCONTROL_COMMENTS,
  GET_SUBCONTROL_DISCUSSION_BY_ID,
  GET_SUBCONTROL_SELECT_OPTIONS,
  GET_SUBCONTROLS_BY_REFCODE,
  GET_SUBCONTROLS_PAGINATED,
  UPDATE_SUBCONTROL,
  UPDATE_SUBCONTROL_COMMENT,
  INSERT_SUBCONTROL_PLATE_COMMENT,
} from '@repo/codegen/query/subcontrol'
import {
  CreateSubcontrolMutation,
  CreateSubcontrolMutationVariables,
  DeleteSubcontrolMutation,
  DeleteSubcontrolMutationVariables,
  GetAllSubcontrolsQuery,
  GetAllSubcontrolsQueryVariables,
  GetSubcontrolAssociationsByIdQuery,
  GetSubcontrolAssociationsByIdQueryVariables,
  GetSubcontrolByIdMinifiedQuery,
  GetSubcontrolByIdMinifiedQueryVariables,
  GetSubcontrolByIdQuery,
  GetSubcontrolDiscussionByIdQuery,
  GetSubcontrolsByRefCodeQuery,
  GetSubcontrolSelectOptionsQuery,
  GetSubcontrolSelectOptionsQueryVariables,
  GetSubcontrolsPaginatedQuery,
  GetSubcontrolsPaginatedQueryVariables,
  Subcontrol,
  SubcontrolWhereInput,
  UpdateSubcontrolMutation,
  UpdateSubcontrolMutationVariables,
  InsertSubcontrolPlateCommentMutation,
  InsertSubcontrolPlateCommentMutationVariables,
} from '@repo/codegen/src/schema'
import { useEffect, useMemo } from 'react'
import { TPagination } from '@repo/ui/pagination-types'
import { GetSubcontrolCommentsQuery, GetSubcontrolCommentsQueryVariables, UpdateSubcontrolCommentMutation, UpdateSubcontrolCommentMutationVariables } from '@repo/codegen/src/schema'

export type SubcontrolByIdNode = GetSubcontrolByIdQuery['subcontrol']
export type SubcontrolsByRefcodeEdge = NonNullable<NonNullable<NonNullable<GetSubcontrolsByRefCodeQuery['subcontrols']>['edges']>[number]>
export type SubcontrolsByRefcodeNode = NonNullable<SubcontrolsByRefcodeEdge['node']>

type UseGetAllSubcontrolsArgs = {
  where?: GetAllSubcontrolsQueryVariables['where']
  pagination?: TPagination | null
  enabled?: boolean
}

export const useGetAllSubcontrols = ({ where, pagination, enabled = true }: UseGetAllSubcontrolsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllSubcontrolsQuery, unknown>({
    queryKey: ['subcontrols', where, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request<GetAllSubcontrolsQuery, GetAllSubcontrolsQueryVariables>(GET_ALL_SUBCONTROLS, {
        where,
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.subcontrols?.edges ?? []
  const subcontrols = edges.map((edge) => edge?.node) as Subcontrol[]

  const paginationMeta = {
    totalCount: queryResult.data?.subcontrols?.totalCount ?? 0,
    pageInfo: queryResult.data?.subcontrols?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    subcontrols,
    paginationMeta,
  }
}

export const useGetSubcontrolById = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolByIdQuery, unknown>({
    queryKey: ['subcontrols', subcontrolId],
    queryFn: async () => client.request(GET_SUBCONTROL_BY_ID, { subcontrolId }),
    enabled: !!subcontrolId,
  })
}

export const useGetSubcontrolAssociationsById = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolAssociationsByIdQuery, unknown>({
    queryKey: ['subcontrols', subcontrolId, 'associations'],
    queryFn: async () => client.request<GetSubcontrolAssociationsByIdQuery, GetSubcontrolAssociationsByIdQueryVariables>(GET_SUBCONTROL_ASSOCIATIONS_BY_ID, { subcontrolId: subcontrolId as string }),
    enabled: !!subcontrolId,
  })
}

export const useUpdateSubcontrol = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubcontrolMutation, unknown, UpdateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useDeleteSubcontrol = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteSubcontrolMutation, unknown, DeleteSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useCreateSubcontrol = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateSubcontrolMutation, unknown, CreateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useSubcontrolSelect = ({ where, enabled = true }: { where?: SubcontrolWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const { data, isLoading, error } = useQuery<GetSubcontrolSelectOptionsQuery>({
    queryKey: ['subcontrols', where, 'select'],
    queryFn: async () => {
      return client.request<GetSubcontrolSelectOptionsQuery, GetSubcontrolSelectOptionsQueryVariables>(GET_SUBCONTROL_SELECT_OPTIONS, { where })
    },
    enabled,
  })

  const subcontrolOptions = useMemo(
    () =>
      data?.subcontrols?.edges?.flatMap((edge) =>
        edge?.node?.id && edge.node.refCode ? [{ label: `${edge.node.refCode}${edge.node.referenceFramework ? `( ${edge.node.referenceFramework})` : ''}`, value: edge.node.id }] : [],
      ) ?? [],
    [data],
  )

  return {
    subcontrolOptions,
    isLoading,
    error,
    data,
  }
}

export function useFetchAllSubcontrols(where?: SubcontrolWhereInput, enabled = true) {
  const { client } = useGraphQLClient()

  return useInfiniteQuery<GetSubcontrolsPaginatedQuery['subcontrols'], Error, InfiniteData<GetSubcontrolsPaginatedQuery['subcontrols']>, ['subcontrols', 'infinite', SubcontrolWhereInput?]>({
    queryKey: ['subcontrols', 'infinite', where],
    queryFn: async ({ pageParam }) => {
      const { subcontrols } = await client.request<GetSubcontrolsPaginatedQuery, GetSubcontrolsPaginatedQueryVariables>(GET_SUBCONTROLS_PAGINATED, {
        where,
        after: pageParam,
      })
      return subcontrols
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
    enabled,
  })
}

export function useAllSubcontrolsGrouped({ where, enabled = true }: { where?: SubcontrolWhereInput; enabled?: boolean }) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isFetching, ...rest } = useFetchAllSubcontrols(where, enabled)

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allSubcontrols = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.edges?.map((edge) => edge?.node) ?? []) ?? []
    return raw.filter((c): c is NonNullable<typeof c> => c != null)
  }, [data?.pages])

  const isLoadingAll = isLoading || isFetchingNextPage || hasNextPage || isFetching

  if (isLoadingAll) {
    return { isLoading: true, allSubcontrols: [] }
  }

  return {
    allSubcontrols,
    isLoading: isLoadingAll,
    hasNextPage,
    fetchNextPage,
    ...rest,
  }
}

export function useGetSubcontrolMinifiedById(subcontrolId?: string, enabled = true) {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolByIdMinifiedQuery, Error>({
    queryKey: ['subcontrols', subcontrolId, 'minified'],
    queryFn: async () => {
      const data = await client.request<GetSubcontrolByIdMinifiedQuery, GetSubcontrolByIdMinifiedQueryVariables>(GET_SUBCONTROL_BY_ID_MINIFIED, { subcontrolId: subcontrolId! })
      return data
    },
    enabled: !!subcontrolId && enabled,
  })
}

type UseGetSubcontrolsByRefCodeArgs = {
  refCodeIn: string[]
  enabled?: boolean
}

export const useGetSubcontrolsByRefCode = ({ refCodeIn, enabled = true }: UseGetSubcontrolsByRefCodeArgs) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolsByRefCodeQuery, unknown>({
    queryKey: ['subcontrols', refCodeIn],
    queryFn: async () => await client.request(GET_SUBCONTROLS_BY_REFCODE, { refCodeIn }),

    enabled: enabled && refCodeIn.length > 0,
  })
}

export const useGetSubcontrolComments = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolCommentsQuery, unknown>({
    queryKey: ['subcontrolComments', subcontrolId],
    queryFn: async () => client.request<GetSubcontrolCommentsQuery, GetSubcontrolCommentsQueryVariables>(GET_SUBCONTROL_COMMENTS, { subcontrolId: subcontrolId! }),
    enabled: !!subcontrolId,
  })
}

export const useUpdateSubcontrolComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubcontrolCommentMutation, unknown, UpdateSubcontrolCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SUBCONTROL_COMMENT, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['subcontrolComments', data.updateSubcontrolComment.subcontrol.id],
      })
    },
  })
}

export const SUBCONTROL_DISCUSSION_QUERY_KEY = 'subcontrolsDiscussion'

export const useGetSubcontrolDiscussionById = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolDiscussionByIdQuery, unknown>({
    queryKey: [SUBCONTROL_DISCUSSION_QUERY_KEY, subcontrolId],
    queryFn: async () => client.request(GET_SUBCONTROL_DISCUSSION_BY_ID, { subcontrolId }),
    enabled: !!subcontrolId,
  })
}

export const useInsertSubcontrolPlateComment = () => {
  const { client } = useGraphQLClient()

  return useMutation<InsertSubcontrolPlateCommentMutation, unknown, InsertSubcontrolPlateCommentMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(INSERT_SUBCONTROL_PLATE_COMMENT, variables)
    },
  })
}

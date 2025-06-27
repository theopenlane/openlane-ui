import { InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_SUBCONTROL,
  DELETE_SUBCONTROL,
  GET_ALL_SUBCONTROLS,
  GET_SUBCONTROL_BY_ID,
  GET_SUBCONTROL_BY_ID_MINIFIED,
  GET_SUBCONTROL_SELECT_OPTIONS,
  GET_SUBCONTROLS_PAGINATED,
  UPDATE_SUBCONTROL,
} from '@repo/codegen/query/subcontrol'
import {
  CreateSubcontrolMutation,
  CreateSubcontrolMutationVariables,
  DeleteSubcontrolMutation,
  DeleteSubcontrolMutationVariables,
  GetAllSubcontrolsQuery,
  GetAllSubcontrolsQueryVariables,
  GetSubcontrolByIdMinifiedQuery,
  GetSubcontrolByIdMinifiedQueryVariables,
  GetSubcontrolByIdQuery,
  GetSubcontrolSelectOptionsQuery,
  GetSubcontrolSelectOptionsQueryVariables,
  GetSubcontrolsPaginatedQuery,
  GetSubcontrolsPaginatedQueryVariables,
  SubcontrolWhereInput,
  UpdateSubcontrolMutation,
  UpdateSubcontrolMutationVariables,
} from '@repo/codegen/src/schema'
import { useEffect, useMemo } from 'react'

export function useGetAllSubcontrols(where?: GetAllSubcontrolsQueryVariables['where']) {
  const { client } = useGraphQLClient()

  return useQuery<GetAllSubcontrolsQuery, unknown>({
    queryKey: ['subcontrols', where],
    queryFn: async () =>
      client.request<GetAllSubcontrolsQuery, GetAllSubcontrolsQueryVariables>(GET_ALL_SUBCONTROLS, {
        where,
      }),
  })
}

export const useGetSubcontrolById = (subcontrolId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetSubcontrolByIdQuery, unknown>({
    queryKey: ['subcontrols', subcontrolId],
    queryFn: async () => client.request(GET_SUBCONTROL_BY_ID, { subcontrolId }),
    enabled: !!subcontrolId,
  })
}

export const useUpdateSubcontrol = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubcontrolMutation, unknown, UpdateSubcontrolMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SUBCONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })
      queryClient.invalidateQueries({ queryKey: ['mappedcontrols'] })
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
      queryClient.invalidateQueries({ queryKey: ['mappedcontrols'] })
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
      queryClient.invalidateQueries({ queryKey: ['mappedcontrols'] })
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

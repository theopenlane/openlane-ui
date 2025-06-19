import { useMutation, useQuery, useQueryClient, useInfiniteQuery, InfiniteData } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_CONTROL,
  CREATE_CSV_BULK_CONTROL,
  DELETE_CONTROL,
  GET_ALL_CONTROLS,
  GET_CONTROL_BY_ID,
  GET_CONTROL_BY_ID_MINIFIED,
  GET_CONTROL_CATEGORIES,
  GET_CONTROL_COUNTS_BY_STATUS,
  GET_CONTROL_SELECT_OPTIONS,
  GET_CONTROL_SUBCATEGORIES,
  GET_CONTROLS_PAGINATED,
  UPDATE_CONTROL,
} from '@repo/codegen/query/control'

import {
  Control,
  ControlWhereInput,
  CreateBulkCsvControlMutation,
  CreateBulkCsvControlMutationVariables,
  CreateControlMutation,
  CreateControlMutationVariables,
  DeleteControlMutation,
  DeleteControlMutationVariables,
  GetAllControlsQuery,
  GetAllControlsQueryVariables,
  GetControlByIdMinifiedQuery,
  GetControlByIdMinifiedQueryVariables,
  GetControlByIdQuery,
  GetControlCategoriesQuery,
  GetControlCountsByStatusQuery,
  GetControlSelectOptionsQuery,
  GetControlSelectOptionsQueryVariables,
  GetControlsPaginatedQuery,
  GetControlsPaginatedQueryVariables,
  GetControlSubcategoriesQuery,
  UpdateControlMutation,
  UpdateControlMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { useEffect, useMemo } from 'react'

type UseGetAllControlsArgs = {
  where?: GetAllControlsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetAllControlsQueryVariables['orderBy']
  enabled?: boolean
}

export const useGetAllControls = ({ where, pagination, orderBy, enabled = true }: UseGetAllControlsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllControlsQuery>({
    queryKey: ['controls', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_ALL_CONTROLS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.controls?.edges ?? []
  const controls = edges.map((edge) => edge?.node) as Control[]

  const paginationMeta = {
    totalCount: queryResult.data?.controls?.totalCount ?? 0,
    pageInfo: queryResult.data?.controls?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    controls,
    paginationMeta,
  }
}

export const useGetControlById = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlByIdQuery, unknown>({
    queryKey: ['controls', controlId],
    queryFn: async () => client.request(GET_CONTROL_BY_ID, { controlId }),
    enabled: !!controlId,
  })
}

export const useUpdateControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlMutation, unknown, UpdateControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['controls'] }),
  })
}

export const useGetControlCountsByStatus = (programId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlCountsByStatusQuery, unknown>({
    queryKey: ['controls', 'counts', programId],
    queryFn: async () => client.request(GET_CONTROL_COUNTS_BY_STATUS, { programId }),
    enabled: !!programId,
  })
}

export const useCreateBulkCSVControl = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvControlMutation, unknown, CreateBulkCsvControlMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_CONTROL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useDeleteControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteControlMutation, unknown, DeleteControlMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useCreateControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateControlMutation, unknown, CreateControlMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useControlSelect = ({ where, enabled = true }: { where?: ControlWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const { data, isLoading, error } = useQuery<GetControlSelectOptionsQuery>({
    queryKey: ['controls', where, 'select'],
    queryFn: async () => {
      return client.request<GetControlSelectOptionsQuery, GetControlSelectOptionsQueryVariables>(GET_CONTROL_SELECT_OPTIONS, { where })
    },
    enabled,
  })

  const controlOptions = useMemo(
    () =>
      data?.controls?.edges?.flatMap((edge) =>
        edge?.node?.id && edge.node.refCode ? [{ label: `${edge.node.refCode}${edge.node.referenceFramework ? `( ${edge.node.referenceFramework})` : ''}`, value: edge.node.id }] : [],
      ) ?? [],
    [data],
  )

  return {
    controlOptions,
    isLoading,
    error,
    data,
  }
}

export const useGetControlCategories = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlCategoriesQuery, Error>({
    queryKey: ['controlCategories'],
    queryFn: () => client.request<GetControlCategoriesQuery>(GET_CONTROL_CATEGORIES),
  })
}

export const useGetControlSubcategories = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlSubcategoriesQuery, Error>({
    queryKey: ['controlSubcategories'],
    queryFn: () => client.request<GetControlSubcategoriesQuery>(GET_CONTROL_SUBCATEGORIES),
  })
}

export function useFetchAllControls(where?: ControlWhereInput, enabled = true) {
  const { client } = useGraphQLClient()

  return useInfiniteQuery<GetControlsPaginatedQuery['controls'], Error, InfiniteData<GetControlsPaginatedQuery['controls']>, ['controls', 'infinite', ControlWhereInput?]>({
    queryKey: ['controls', 'infinite', where],
    queryFn: async ({ pageParam }) => {
      const { controls } = await client.request<GetControlsPaginatedQuery, GetControlsPaginatedQueryVariables>(GET_CONTROLS_PAGINATED, {
        where,
        after: pageParam,
      })
      return controls
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
    enabled,
  })
}

export function useAllControlsGrouped({ where, enabled = true }: { where?: ControlWhereInput; enabled?: boolean }) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isFetching, ...rest } = useFetchAllControls(where, enabled)

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allControls = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.edges?.map((edge) => edge?.node) ?? []) ?? []
    return raw.filter((c): c is NonNullable<typeof c> => c != null)
  }, [data?.pages])

  const isLoadingAll = isLoading || isFetchingNextPage || hasNextPage || isFetching

  if (isLoadingAll) {
    return { isLoading: true, allControls: [] }
  }

  return {
    allControls,
    isLoading: isLoadingAll,
    hasNextPage,
    fetchNextPage,
    ...rest,
  }
}

export function useGetControlMinifiedById(controlId?: string, enabled = true) {
  const { client } = useGraphQLClient()

  return useQuery<GetControlByIdMinifiedQuery, Error>({
    queryKey: ['controls', controlId, 'minified'],
    queryFn: async () => {
      const data = await client.request<GetControlByIdMinifiedQuery, GetControlByIdMinifiedQueryVariables>(GET_CONTROL_BY_ID_MINIFIED, { controlId: controlId! })
      return data
    },
    enabled: !!controlId && enabled,
  })
}

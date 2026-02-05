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
  GET_CONTROLS_PAGINATED_WITH_LIST_FIELDS,
  GET_CONTROLS_GROUPED_BY_CATEGORY_RESOLVER,
  BULK_EDIT_CONTROL,
  CLONE_CSV_BULK_CONTROL,
  GET_CONTROLS_BY_REFCODE,
  GET_CONTROL_COMMENTS,
  UPDATE_CONTROL_COMMENT,
  CREATE_CSV_BULK_MAPPED_CONTROL,
  DELETE_NOTE,
  BULK_DELETE_CONTROL,
  GET_SUGGESTED_CONTROLS_OR_SUBCONTROLS,
  GET_CONTROL_ASSOCIATIONS_BY_ID,
  GET_CONTROL_NOT_IMPLEMENTED_COUNT,
  INSERT_CONTROL_PLATE_COMMENT,
  GET_CONTROL_DISCUSSION_BY_ID,
  UPDATE_CSV_BULK_CONTROL,
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
  UpdateBulkCsvControlMutation,
  UpdateBulkCsvControlMutationVariables,
  UpdateControlMutation,
  UpdateControlMutationVariables,
  GetControlsPaginatedWithListFieldsQuery,
  GetControlsPaginatedWithListFieldsQueryVariables,
  ControlListStandardFieldsFragment,
  GetControlsGroupedByCategoryResolverQuery,
  UpdateBulkControlMutation,
  UpdateBulkControlMutationVariables,
  CloneBulkCsvControlMutation,
  CloneBulkCsvControlMutationVariables,
  GetControlsByRefCodeQuery,
  GetControlCommentsQuery,
  GetControlCommentsQueryVariables,
  UpdateControlCommentMutation,
  UpdateControlCommentMutationVariables,
  CreateBulkCsvMappedControlMutation,
  CreateBulkCsvMappedControlMutationVariables,
  DeleteNoteMutation,
  DeleteNoteMutationVariables,
  DeleteBulkControlMutation,
  DeleteBulkControlMutationVariables,
  MappedControlWhereInput,
  GetSuggestedControlsOrSubcontrolsQuery,
  GetControlAssociationsByIdQuery,
  GetControlAssociationsByIdQueryVariables,
  GetNotImplementedControlCountQuery,
  InsertControlPlateCommentMutation,
  InsertControlPlateCommentMutationVariables,
  GetControlDiscussionByIdQuery,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { useEffect, useMemo } from 'react'

export type ControlByIdNode = GetControlByIdQuery['control']
export type ControlsByRefcodeEdge = NonNullable<NonNullable<NonNullable<GetControlsByRefCodeQuery['controls']>['edges']>[number]>
export type ControlsByRefcodeNode = NonNullable<ControlsByRefcodeEdge['node']>

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

export const useGetControlAssociationsById = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlAssociationsByIdQuery, unknown>({
    queryKey: ['controls', controlId, 'associations'],
    queryFn: async () => client.request<GetControlAssociationsByIdQuery, GetControlAssociationsByIdQueryVariables>(GET_CONTROL_ASSOCIATIONS_BY_ID, { controlId: controlId as string }),
    enabled: !!controlId,
  })
}

export const useUpdateControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlMutation, unknown, UpdateControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useBulkEditControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkControlMutation, unknown, UpdateBulkControlMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
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

export const useUpdateBulkCSVControl = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkCsvControlMutation, unknown, UpdateBulkCsvControlMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_CSV_BULK_CONTROL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
    },
  })
}

export const useCreateBulkCSVMappedControl = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvMappedControlMutation, unknown, CreateBulkCsvMappedControlMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_MAPPED_CONTROL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useCloneBulkCSVControl = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CloneBulkCsvControlMutation, unknown, CloneBulkCsvControlMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CLONE_CSV_BULK_CONTROL, variables }),
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
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
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
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
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
        edge?.node?.id && edge.node.refCode ? [{ label: `${edge.node.refCode}${edge.node.referenceFramework ? ` (${edge.node.referenceFramework})` : ' (CUSTOM)'}`, value: edge.node.id }] : [],
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

export const useGetControlCategories = ({ enabled = true }: { enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlCategoriesQuery, Error>({
    queryKey: ['controlCategories'],
    queryFn: () => client.request<GetControlCategoriesQuery>(GET_CONTROL_CATEGORIES),
    enabled,
  })
}

export const useGetControlSubcategories = ({ enabled = true }: { enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlSubcategoriesQuery, Error>({
    queryKey: ['controlSubcategories'],
    queryFn: () => client.request<GetControlSubcategoriesQuery>(GET_CONTROL_SUBCATEGORIES),
    enabled,
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

export function useFetchAllControlsWithListFields(where?: ControlWhereInput, enabled = true) {
  const { client } = useGraphQLClient()

  return useInfiniteQuery<GetControlsPaginatedWithListFieldsQuery['controls'], Error, InfiniteData<GetControlsPaginatedWithListFieldsQuery['controls']>, ['controls', 'infinite', ControlWhereInput?]>({
    queryKey: ['controls', 'infinite', where],
    queryFn: async ({ pageParam }) => {
      const { controls } = await client.request<GetControlsPaginatedWithListFieldsQuery, GetControlsPaginatedWithListFieldsQueryVariables>(GET_CONTROLS_PAGINATED_WITH_LIST_FIELDS, {
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

export function useAllControlsGroupedWithListFields({ where, enabled = true }: { where?: ControlWhereInput; enabled?: boolean }) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isFetching, ...rest } = useFetchAllControlsWithListFields(where, enabled)

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allControls = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.edges?.map((edge) => edge?.node) ?? []) ?? []
    return raw.filter((c): c is ControlListStandardFieldsFragment => c != null)
  }, [data?.pages])

  const groupedControls = useMemo(() => {
    return allControls.reduce<Record<string, ControlListStandardFieldsFragment[]>>((acc, control) => {
      const category = control.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(control)
      return acc
    }, {})
  }, [allControls])

  const isLoadingAll = isLoading || isFetchingNextPage || hasNextPage || isFetching

  return {
    isLoading: isLoadingAll,
    allControls,
    groupedControls,
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

export const useGetControlsGroupedByCategoryResolver = ({ where, enabled }: { where?: ControlWhereInput; enabled: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: ['controls', 'allGroupedByCategory', where],
    enabled,
    queryFn: async () => {
      const allControls: Record<
        string,
        {
          id: string
          refCode: string
          status?: string | null
          referenceFramework?: string | null
        }[]
      > = {}

      const cursors: Record<string, string | null> = {}
      const hasNextMap: Record<string, boolean> = {}

      const initial = await client.request<GetControlsGroupedByCategoryResolverQuery>(GET_CONTROLS_GROUPED_BY_CATEGORY_RESOLVER, { where })

      for (const edge of initial.controlsGroupByCategory.edges) {
        const category = edge.node.category

        const controls = edge.node.controls.edges?.map((e) => e?.node).filter((node): node is NonNullable<typeof node> => Boolean(node?.id && node?.refCode))

        if (controls && category) {
          allControls[category] = controls
          cursors[category] = edge.node.controls.pageInfo.endCursor
          hasNextMap[category] = edge.node.controls.pageInfo.hasNextPage
        }
      }

      const fetchNextForCategory = async (category: string, after: string) => {
        const response = await client.request<GetControlsGroupedByCategoryResolverQuery>(GET_CONTROLS_GROUPED_BY_CATEGORY_RESOLVER, {
          where,
          category,
          after,
        })

        const node = response.controlsGroupByCategory.edges?.[0]?.node
        if (!node) return

        const newControls = node.controls?.edges?.map((e) => e?.node).filter((node): node is NonNullable<typeof node> => Boolean(node?.id && node?.refCode)) ?? []

        allControls[category] = [...(allControls[category] || []), ...newControls]

        if (node.controls.pageInfo.hasNextPage && node.controls.pageInfo.endCursor) {
          await fetchNextForCategory(category, node.controls.pageInfo.endCursor)
        }
      }

      const promises = Object.entries(hasNextMap)
        .filter(([, hasNext]) => hasNext)
        .map(([category]) => fetchNextForCategory(category, cursors[category]!))

      await Promise.all(promises)

      return Object.entries(allControls).map(([category, controls]) => ({
        category,
        controls,
      }))
    },
  })
}

type UseGetControlsByRefCodeArgs = {
  refCodeIn: string[]
  enabled?: boolean
}

export const useGetControlsByRefCode = ({ refCodeIn, enabled = true }: UseGetControlsByRefCodeArgs) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlsByRefCodeQuery, unknown>({
    queryKey: ['controls', refCodeIn],
    queryFn: async () => await client.request(GET_CONTROLS_BY_REFCODE, { refCodeIn }),

    enabled: enabled && refCodeIn.length > 0,
  })
}

export const useGetControlComments = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlCommentsQuery, unknown>({
    queryKey: ['controlComments', controlId],
    queryFn: async () => client.request<GetControlCommentsQuery, GetControlCommentsQueryVariables>(GET_CONTROL_COMMENTS, { controlId: controlId! }),
    enabled: !!controlId,
  })
}

export const useUpdateControlComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlCommentMutation, unknown, UpdateControlCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL_COMMENT, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['controlComments', data.updateControlComment.control.id] })
    },
  })
}

export const useDeleteNote = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteNoteMutation, unknown, DeleteNoteMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_NOTE, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['controlComments', data.deleteNote.deletedID] })
    },
  })
}

export const useBulkDeleteControls = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteBulkControlMutation, unknown, DeleteBulkControlMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['mappedControls'] })
    },
  })
}

export const useGetSuggestedControlsOrSubcontrols = ({ where, enabled = true }: { where?: MappedControlWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetSuggestedControlsOrSubcontrolsQuery>({
    queryKey: ['mappedcontrols', where],
    queryFn: () =>
      client.request(GET_SUGGESTED_CONTROLS_OR_SUBCONTROLS, {
        where,
      }),
    enabled,
  })

  return {
    ...queryResult,
  }
}

export const useGetControlNotImplementedCount = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetNotImplementedControlCountQuery, unknown>({
    queryKey: ['controls', 'controlNotImplementedCount'],
    queryFn: async () => client.request(GET_CONTROL_NOT_IMPLEMENTED_COUNT),
    enabled: true,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.controls?.totalCount ?? 0,
  }
}

export const CONTROL_DISCUSSION_QUERY_KEY = 'controlsDiscussion'

export const useGetControlDiscussionById = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlDiscussionByIdQuery, unknown>({
    queryKey: [CONTROL_DISCUSSION_QUERY_KEY, controlId],
    queryFn: async () => client.request(GET_CONTROL_DISCUSSION_BY_ID, { controlId }),
    enabled: !!controlId,
  })
}

export const useInsertControlPlateComment = () => {
  const { client } = useGraphQLClient()

  return useMutation<InsertControlPlateCommentMutation, unknown, InsertControlPlateCommentMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(INSERT_CONTROL_PLATE_COMMENT, variables)
    },
  })
}

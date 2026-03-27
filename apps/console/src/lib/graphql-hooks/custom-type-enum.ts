'use client'

import { useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, useInfiniteQuery, type InfiniteData, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type Option } from '@repo/ui/multiple-selector'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  type CustomTypeEnumWhereInput,
  type CreateCustomTypeEnumInput,
  type UpdateCustomTypeEnumInput,
  type GetCustomTypeEnumsPaginatedQuery,
  type GetCustomTypeEnumByIdQuery,
  type CreateCustomTypeEnumMutation,
  type UpdateCustomTypeEnumMutation,
  type DeleteCustomTypeEnumMutation,
  type GetCustomTypeEnumsPaginatedQueryVariables,
} from '@repo/codegen/src/schema'

import { GET_CUSTOM_TYPE_ENUMS_PAGINATED, GET_CUSTOM_TYPE_ENUM_BY_ID, CREATE_CUSTOM_TYPE_ENUM, UPDATE_CUSTOM_TYPE_ENUM, DELETE_CUSTOM_TYPE_ENUM } from '@repo/codegen/query/custom-type-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'

export type CustomTypeEnumOption = Option & { color?: string; description?: string }

const useFetchAllCustomTypeEnums = () => {
  const { client } = useGraphQLClient()

  return useInfiniteQuery<GetCustomTypeEnumsPaginatedQuery['customTypeEnums'], Error, InfiniteData<GetCustomTypeEnumsPaginatedQuery['customTypeEnums']>, ['customTypeEnums', 'all']>({
    queryKey: ['customTypeEnums', 'all'],
    queryFn: async ({ pageParam }) => {
      const { customTypeEnums } = await client.request<GetCustomTypeEnumsPaginatedQuery, GetCustomTypeEnumsPaginatedQueryVariables>(GET_CUSTOM_TYPE_ENUMS_PAGINATED, { after: pageParam })
      return customTypeEnums
    },
    initialPageParam: undefined,
    getNextPageParam: (last) => (last.pageInfo.hasNextPage ? last.pageInfo.endCursor : undefined),
    staleTime: 5 * 60 * 1000,
  })
}

const useAllCustomTypeEnums = () => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, isFetching, ...rest } = useFetchAllCustomTypeEnums()

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allEdges = useMemo(() => {
    return data?.pages.flatMap((page) => page.edges ?? []) ?? []
  }, [data?.pages])

  const isLoadingAll = isLoading || isFetchingNextPage || hasNextPage || isFetching

  return { ...rest, allEdges, isLoading: isLoadingAll, isSuccess: !isLoadingAll && !rest.isError }
}

export const useGetCustomTypeEnums = ({ where }: { where?: CustomTypeEnumWhereInput } = {}) => {
  const { allEdges, ...queryRest } = useAllCustomTypeEnums()

  const filteredEdges = useMemo(() => {
    if (!allEdges || allEdges.length === 0) return null
    if (!where?.objectType && !where?.field) return allEdges
    return allEdges.filter((edge) => {
      const node = edge?.node
      if (!node) return false
      if (where.objectType && node.objectType !== where.objectType) return false
      if (where.field && node.field !== where.field) return false
      return true
    })
  }, [allEdges, where])

  const enumOptions: CustomTypeEnumOption[] = useMemo(
    () =>
      filteredEdges?.reduce<CustomTypeEnumOption[]>((acc, edge) => {
        if (edge?.node) {
          acc.push({
            value: edge.node.name,
            label: edge.node.name,
            color: edge.node.color ?? undefined,
            description: edge.node.description ?? '',
          })
        }
        return acc
      }, []) ?? [],
    [filteredEdges],
  )

  const data = useMemo(() => {
    if (allEdges.length === 0 && !filteredEdges) return undefined
    return {
      customTypeEnums: { edges: filteredEdges },
    }
  }, [allEdges, filteredEdges])

  return { ...queryRest, data, enumOptions }
}

export type CustomTypeEnumNode = NonNullable<NonNullable<NonNullable<GetCustomTypeEnumsPaginatedQuery['customTypeEnums']>['edges']>[number]>['node']

export type CustomTypeEnumNodeNonNull = NonNullable<CustomTypeEnumNode>

export const useCustomTypeEnumsPaginated = ({
  pagination,
  where,
  orderBy,
  enabled = true,
}: {
  pagination: TPagination
  where?: CustomTypeEnumWhereInput
  orderBy?: GetCustomTypeEnumsPaginatedQueryVariables['orderBy']
  enabled?: boolean
}) => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetCustomTypeEnumsPaginatedQuery>({
    queryKey: ['customTypeEnums', 'paginated', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetCustomTypeEnumsPaginatedQuery, GetCustomTypeEnumsPaginatedQueryVariables>(GET_CUSTOM_TYPE_ENUMS_PAGINATED, {
        ...pagination?.query,
        where,
        orderBy,
      }),
    enabled,
  })

  const edges = query.data?.customTypeEnums?.edges ?? []

  const enums: CustomTypeEnumNodeNonNull[] = edges
    .filter((edge): edge is NonNullable<(typeof edges)[number]> => edge != null)
    .map((edge) => edge.node)
    .filter((node): node is CustomTypeEnumNodeNonNull => node != null)

  const paginationMeta = {
    totalCount: query.data?.customTypeEnums?.totalCount ?? 0,
    pageInfo: query.data?.customTypeEnums?.pageInfo,
    isLoading: query.isFetching,
  }

  return {
    enums,
    paginationMeta,
    ...query,
    isLoading: query.isFetching,
  }
}

export const useCustomTypeEnum = (id: string | null): UseQueryResult<GetCustomTypeEnumByIdQuery> => {
  const { client } = useGraphQLClient()
  return useQuery<GetCustomTypeEnumByIdQuery>({
    queryKey: ['customTypeEnums', id],
    queryFn: () => client.request<GetCustomTypeEnumByIdQuery>(GET_CUSTOM_TYPE_ENUM_BY_ID, { id }),
    enabled: !!id,
  })
}

export const useCreateCustomTypeEnum = (): UseMutationResult<CreateCustomTypeEnumMutation, Error, CreateCustomTypeEnumInput> => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomTypeEnumInput) => client.request<CreateCustomTypeEnumMutation>(CREATE_CUSTOM_TYPE_ENUM, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customTypeEnums'] })
    },
  })
}

export const useUpdateCustomTypeEnum = (): UseMutationResult<UpdateCustomTypeEnumMutation, Error, { id: string; input: UpdateCustomTypeEnumInput }> => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }) => client.request<UpdateCustomTypeEnumMutation>(UPDATE_CUSTOM_TYPE_ENUM, { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customTypeEnums'] })
    },
  })
}

export const useDeleteCustomTypeEnum = (): UseMutationResult<DeleteCustomTypeEnumMutation, Error, string> => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => client.request<DeleteCustomTypeEnumMutation>(DELETE_CUSTOM_TYPE_ENUM, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customTypeEnums'] })
    },
  })
}

export const useCreatableEnumOptions = ({ objectType, field, isEditAllowed }: { objectType?: string; field: string; isEditAllowed?: boolean }) => {
  const { data: orgPermission } = useOrganizationRoles()
  const canEditOrg = canEdit(orgPermission?.roles)
  const resolvedEditAllowed = isEditAllowed ?? canEditOrg

  const { enumOptions, ...rest } = useGetCustomTypeEnums({
    where: { objectType, field },
  })
  const { mutateAsync: createEnum } = useCreateCustomTypeEnum()

  const onCreateOption = resolvedEditAllowed
    ? async (value: string) => {
        await createEnum({ name: value, objectType: objectType ?? '', field })
      }
    : undefined

  return { enumOptions, onCreateOption, ...rest }
}

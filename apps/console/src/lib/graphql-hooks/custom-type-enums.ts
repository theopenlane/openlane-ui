'use client'

import { useMutation, useQuery, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { Option } from '@repo/ui/multiple-selector'
import { TPagination } from '@repo/ui/pagination-types'
import {
  CustomTypeEnumWhereInput,
  CreateCustomTypeEnumInput,
  UpdateCustomTypeEnumInput,
  GetCustomTypeEnumsQuery,
  GetCustomTypeEnumsPaginatedQuery,
  CustomTypeEnum,
  GetCustomTypeEnumByIdQuery,
  CreateCustomTypeEnumMutation,
  UpdateCustomTypeEnumMutation,
  DeleteCustomTypeEnumMutation,
} from '@repo/codegen/src/schema'

import {
  GET_CUSTOM_TYPE_ENUMS,
  GET_CUSTOM_TYPE_ENUMS_PAGINATED,
  GET_CUSTOM_TYPE_ENUM_BY_ID,
  CREATE_CUSTOM_TYPE_ENUM,
  UPDATE_CUSTOM_TYPE_ENUM,
  DELETE_CUSTOM_TYPE_ENUM,
} from '@repo/codegen/query/custom-type-enum'

export const useGetCustomTypeEnums = ({ where }: { where?: CustomTypeEnumWhereInput } = {}) => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetCustomTypeEnumsQuery>({
    queryKey: ['customTypeEnums', where],
    queryFn: () => client.request<GetCustomTypeEnumsQuery>(GET_CUSTOM_TYPE_ENUMS, { where }),
  })

  const enumOptions: (Option & { color?: string; description: string })[] =
    query.data?.customTypeEnums?.edges?.reduce<(Option & { color?: string; description: string })[]>((acc, edge) => {
      if (edge?.node) {
        acc.push({
          value: edge.node.name,
          label: edge.node.name,
          color: edge.node.color ?? undefined,
          description: edge.node.description ?? '',
        })
      }
      return acc
    }, []) ?? []

  return { ...query, enumOptions }
}

export const useCustomTypeEnumsPaginated = ({ pagination, where, enabled = true }: { pagination: TPagination; where?: CustomTypeEnumWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetCustomTypeEnumsPaginatedQuery>({
    queryKey: ['customTypeEnums', 'paginated', pagination, where],
    queryFn: () =>
      client.request<GetCustomTypeEnumsPaginatedQuery>(GET_CUSTOM_TYPE_ENUMS_PAGINATED, {
        ...pagination?.query,
        where,
      }),
    enabled,
  })

  const edges = query.data?.customTypeEnums?.edges || []

  const nodes = edges.reduce<CustomTypeEnum[]>((acc, edge) => {
    if (edge?.node) {
      acc.push(edge.node as CustomTypeEnum)
    }
    return acc
  }, [])

  const paginationMeta = {
    totalCount: query.data?.customTypeEnums?.totalCount ?? 0,
    pageInfo: query.data?.customTypeEnums?.pageInfo,
    isLoading: query.isFetching,
  }

  return {
    enums: nodes,
    paginationMeta,
    ...query,
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

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
  GetCustomTypeEnumByIdQuery,
  CreateCustomTypeEnumMutation,
  UpdateCustomTypeEnumMutation,
  DeleteCustomTypeEnumMutation,
  GetCustomTypeEnumsPaginatedQueryVariables,
} from '@repo/codegen/src/schema'

import {
  GET_CUSTOM_TYPE_ENUMS,
  GET_CUSTOM_TYPE_ENUMS_PAGINATED,
  GET_CUSTOM_TYPE_ENUM_BY_ID,
  CREATE_CUSTOM_TYPE_ENUM,
  UPDATE_CUSTOM_TYPE_ENUM,
  DELETE_CUSTOM_TYPE_ENUM,
} from '@repo/codegen/query/custom-type-enum'

export type CustomTypeEnumOption = Option & { color?: string; description?: string }

export const useGetCustomTypeEnums = ({ where }: { where?: CustomTypeEnumWhereInput } = {}) => {
  const { client } = useGraphQLClient()

  const query = useQuery<GetCustomTypeEnumsQuery>({
    queryKey: ['customTypeEnums', where],
    queryFn: () => client.request<GetCustomTypeEnumsQuery>(GET_CUSTOM_TYPE_ENUMS, { where }),
  })

  const enumOptions: CustomTypeEnumOption[] =
    query.data?.customTypeEnums?.edges?.reduce<CustomTypeEnumOption[]>((acc, edge) => {
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

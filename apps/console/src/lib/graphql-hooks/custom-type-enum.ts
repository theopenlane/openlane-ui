'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query'
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
import { useSession } from 'next-auth/react'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'

export type CustomTypeEnumOption = Option & { color?: string; description?: string }

export const GLOBAL_ENUM_OBJECT_TYPE = ''

export const GLOBAL_ENUM_FIELD = {
  environment: 'environment',
  scope: 'scope',
  accessModel: 'access_model',
  encryptionStatus: 'encryption_status',
  securityTier: 'security_tier',
  criticality: 'criticality',
} as const

export const FILE_CATEGORY_ENUM = { objectType: GLOBAL_ENUM_OBJECT_TYPE, field: 'category' } as const

const CUSTOM_TYPE_ENUMS_ALL_KEY = ['customTypeEnums', 'all'] as const

const EMPTY_NODES: CustomTypeEnumNodeNonNull[] = []

const GLOBAL_ENUM_FIELDS: ReadonlySet<string> = new Set(Object.values(GLOBAL_ENUM_FIELD))

const resolveEnumObjectType = (objectType: string | null | undefined, field: string | null | undefined) =>
  objectType === null || (!!field && GLOBAL_ENUM_FIELDS.has(field)) ? GLOBAL_ENUM_OBJECT_TYPE : objectType

export const invalidateCustomTypeEnums = (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: ['customTypeEnums'] })

export const invalidateCustomTypeEnumsForName = (queryClient: QueryClient, name?: string | null) => {
  if (!name) return

  const normalized = name.toLowerCase()
  const cached = queryClient.getQueryData<CustomTypeEnumNodeNonNull[]>(CUSTOM_TYPE_ENUMS_ALL_KEY)
  const alreadyKnown = cached?.some((node) => node.name.toLowerCase() === normalized)
  if (alreadyKnown) return

  invalidateCustomTypeEnums(queryClient)
}

const useAllCustomTypeEnums = () => {
  const { client } = useGraphQLClient()

  const query = useQuery<CustomTypeEnumNodeNonNull[]>({
    queryKey: CUSTOM_TYPE_ENUMS_ALL_KEY,
    queryFn: () =>
      fetchAllConnectionNodes(async (after) => {
        const { customTypeEnums } = await client.request<GetCustomTypeEnumsPaginatedQuery, GetCustomTypeEnumsPaginatedQueryVariables>(GET_CUSTOM_TYPE_ENUMS_PAGINATED, {
          first: MAX_CONNECTION_RESULTS,
          after,
        })
        return customTypeEnums
      }),
    staleTime: 5 * 60 * 1000, // 5min
  })

  const allNodes = query.data ?? EMPTY_NODES
  const isComplete = query.isError || (!!query.data && !query.isPlaceholderData)

  return { ...query, allNodes, isComplete, isLoading: query.isFetching, isSuccess: !query.isFetching && !query.isError }
}

const enumIdentityKey = ({ objectType, field, name }: CustomTypeEnumNodeNonNull) => `${objectType}\u0000${field}\u0000${name.toLowerCase()}`

type TEnumGroup = { orgOwned?: CustomTypeEnumNodeNonNull; systemOwned?: CustomTypeEnumNodeNonNull }

const groupCustomTypeEnums = (nodes: CustomTypeEnumNodeNonNull[]): TEnumGroup[] => {
  const groups = new Map<string, TEnumGroup>()
  nodes.forEach((node) => {
    const key = enumIdentityKey(node)
    const group = groups.get(key) ?? {}
    const slot = node.systemOwned ? 'systemOwned' : 'orgOwned'
    group[slot] ??= node
    groups.set(key, group)
  })
  return Array.from(groups.values())
}

const getShadowedSystemEnumIds = (nodes: CustomTypeEnumNodeNonNull[]): string[] =>
  groupCustomTypeEnums(nodes)
    .flatMap(({ orgOwned, systemOwned }) => (orgOwned && systemOwned ? [systemOwned.id] : []))
    .sort()

export const findCustomTypeEnumOption = (options: CustomTypeEnumOption[], value?: string | null): CustomTypeEnumOption | undefined => {
  if (!value) return undefined
  const normalized = value.toLowerCase()
  return options.find((option) => option.value === value) ?? options.find((option) => option.value.toLowerCase() === normalized)
}

export const useShadowedSystemEnumIds = () => {
  const { allNodes, isComplete } = useAllCustomTypeEnums()
  const shadowedIds = useMemo(() => getShadowedSystemEnumIds(allNodes), [allNodes])
  return { shadowedIds, isResolved: isComplete }
}

export const useGetCustomTypeEnums = ({ where }: { where?: CustomTypeEnumWhereInput } = {}) => {
  const { allNodes, ...queryRest } = useAllCustomTypeEnums()

  const objectType = resolveEnumObjectType(where?.objectType, where?.field)
  const field = where?.field

  const enumOptions: CustomTypeEnumOption[] = useMemo(() => {
    const nodes = allNodes.filter((node) => (objectType === undefined || node.objectType === objectType) && (!field || node.field === field))
    return groupCustomTypeEnums(nodes).flatMap(({ orgOwned, systemOwned }) => {
      const display = orgOwned ?? systemOwned
      const resolved = systemOwned ?? orgOwned
      if (!display || !resolved) return []
      return [{ value: resolved.name, label: display.name, color: display.color ?? undefined, description: display.description ?? '' }]
    })
  }, [allNodes, objectType, field])

  return { ...queryRest, enumOptions }
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

  const enums = getNodes(query.data?.customTypeEnums)

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
      invalidateCustomTypeEnums(queryClient)
    },
  })
}

export const useUpdateCustomTypeEnum = (): UseMutationResult<UpdateCustomTypeEnumMutation, Error, { id: string; input: UpdateCustomTypeEnumInput }> => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }) => client.request<UpdateCustomTypeEnumMutation>(UPDATE_CUSTOM_TYPE_ENUM, { id, input }),
    onSuccess: () => {
      invalidateCustomTypeEnums(queryClient)
    },
  })
}

export const useDeleteCustomTypeEnum = (): UseMutationResult<DeleteCustomTypeEnumMutation, Error, string> => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => client.request<DeleteCustomTypeEnumMutation>(DELETE_CUSTOM_TYPE_ENUM, { id }),
    onSuccess: () => {
      invalidateCustomTypeEnums(queryClient)
    },
  })
}

export const useCreatableEnumOptions = ({ objectType, field, isEditAllowed }: { objectType?: string; field: string; isEditAllowed?: boolean }) => {
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()

  const canEditOrg = canEdit(orgPermission?.roles, session)
  const resolvedEditAllowed = isEditAllowed ?? canEditOrg

  const { enumOptions, ...rest } = useGetCustomTypeEnums({
    where: { objectType, field },
  })
  const { mutateAsync: createEnum } = useCreateCustomTypeEnum()

  const onCreateOption = resolvedEditAllowed
    ? async (value: string) => {
        await createEnum({ name: value, objectType: resolveEnumObjectType(objectType, field) ?? GLOBAL_ENUM_OBJECT_TYPE, field })
      }
    : undefined

  return { enumOptions, onCreateOption, canCreate: resolvedEditAllowed, ...rest }
}

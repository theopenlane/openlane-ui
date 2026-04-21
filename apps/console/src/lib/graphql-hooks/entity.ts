import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type EntitiesWithFilterQuery,
  type EntitiesWithFilterQueryVariables,
  type CreateEntityMutation,
  type CreateEntityMutationVariables,
  type CreateEntityInput,
  type EntityBulkCreatePayload,
  type UpdateEntityMutation,
  type UpdateEntityMutationVariables,
  type DeleteEntityMutation,
  type DeleteEntityMutationVariables,
  type EntityQuery,
  type EntityQueryVariables,
  type CreateBulkCsvEntityMutation,
  type CreateBulkCsvEntityMutationVariables,
  type UpdateBulkEntityMutation,
  type UpdateBulkEntityMutationVariables,
  type DeleteBulkEntityMutation,
  type DeleteBulkEntityMutationVariables,
  type GetEntityAssociationsQuery,
  type GetEntityFilesPaginatedQuery,
  type UpdateEntityWithFilesMutationVariables,
  type CreateEntityWithFilesMutationVariables,
  type FileOrder,
  type FileWhereInput,
  type InputMaybe,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_ENTITIES,
  CREATE_ENTITY,
  CREATE_BULK_ENTITY,
  UPDATE_ENTITY,
  DELETE_ENTITY,
  ENTITY,
  CREATE_CSV_BULK_ENTITY,
  BULK_EDIT_ENTITY,
  BULK_DELETE_ENTITY,
  GET_ENTITY_ASSOCIATIONS,
  GET_ENTITY_FILES_PAGINATED,
  UPDATE_ENTITY_WITH_FILES,
  CREATE_ENTITY_WITH_FILES,
} from '@repo/codegen/query/entity'

type GetAllEntitiesArgs = {
  where?: EntitiesWithFilterQueryVariables['where']
  orderBy?: EntitiesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type EntitiesNode = NonNullable<NonNullable<NonNullable<EntitiesWithFilterQuery['entities']>['edges']>[number]>['node']

export type EntitiesNodeNonNull = NonNullable<EntitiesNode>

export const useEntitiesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllEntitiesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<EntitiesWithFilterQuery, unknown>({
    queryKey: ['entities', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<EntitiesWithFilterQuery> => {
      const result = await client.request<EntitiesWithFilterQuery>(GET_ALL_ENTITIES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.entities?.edges ?? []

  const entitiesNodes: EntitiesNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as EntitiesNodeNonNull)

  return { ...queryResult, entitiesNodes }
}

export const useVendorsWithFilter = ({ where, orderBy, pagination, enabled }: GetAllEntitiesArgs = {}) => {
  const vendorWhere = { ...where, hasEntityTypeWith: [{ name: 'vendor' }] }
  const { entitiesNodes, ...rest } = useEntitiesWithFilter({ where: vendorWhere, orderBy, pagination, enabled })
  return { ...rest, vendorNodes: entitiesNodes }
}

export const useCreateEntity = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateEntityMutation, unknown, CreateEntityMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

type CreateBulkEntityMutation = {
  createBulkEntity: EntityBulkCreatePayload
}

type CreateBulkEntityMutationVariables = {
  input?: CreateEntityInput[]
  entityTypeName?: string
}

export const useCreateBulkEntity = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateBulkEntityMutation, unknown, CreateBulkEntityMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_BULK_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useUpdateEntity = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateEntityMutation, unknown, UpdateEntityMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useDeleteEntity = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteEntityMutation, unknown, DeleteEntityMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useEntity = (entityId?: EntityQueryVariables['entityId']) => {
  const { client } = useGraphQLClient()
  return useQuery<EntityQuery, unknown>({
    queryKey: ['entities', entityId],
    queryFn: async (): Promise<EntityQuery> => {
      const result = await client.request(ENTITY, { entityId })
      return result as EntityQuery
    },
    enabled: !!entityId,
  })
}

export const useCreateBulkCSVEntity = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvEntityMutation, unknown, CreateBulkCsvEntityMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_ENTITY, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useBulkEditEntity = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkEntityMutation, unknown, UpdateBulkEntityMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useBulkDeleteEntity = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkEntityMutation, unknown, DeleteBulkEntityMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_ENTITY, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useGetEntityAssociations = (entityId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetEntityAssociationsQuery, unknown>({
    queryKey: ['entities', entityId, 'associations'],
    queryFn: async () => client.request<GetEntityAssociationsQuery>(GET_ENTITY_ASSOCIATIONS, { entityId: entityId as string }),
    enabled: !!entityId,
  })
}

type EntityFilesPaginationArgs = {
  entityId?: string | null
  orderBy?: InputMaybe<Array<FileOrder> | FileOrder>
  pagination?: TPagination
  where?: FileWhereInput
}

export const useGetEntityFilesPaginated = ({ entityId, orderBy, pagination, where }: EntityFilesPaginationArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetEntityFilesPaginatedQuery, unknown>({
    queryKey: ['entityFiles', entityId, orderBy, pagination?.page, pagination?.pageSize, where],
    queryFn: async () =>
      client.request(GET_ENTITY_FILES_PAGINATED, {
        entityId,
        orderBy,
        where,
        ...pagination?.query,
      }),
    enabled: !!entityId,
  })

  const entity = queryResult.data?.entity
  const files = entity?.files?.edges?.map((edge) => edge?.node) ?? []
  const pageInfo = entity?.files?.pageInfo
  const totalCount = entity?.files?.totalCount

  return {
    ...queryResult,
    files,
    pageInfo,
    totalCount,
  }
}

export const useUploadEntityFiles = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateEntityMutation, unknown, UpdateEntityWithFilesMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_ENTITY_WITH_FILES, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityFiles'] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useCreateEntityWithFiles = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateEntityMutation, unknown, CreateEntityWithFilesMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_ENTITY_WITH_FILES, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

export const useUpdateEntityLogo = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateEntityMutation, unknown, UpdateEntityWithFilesMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_ENTITY_WITH_FILES, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  EntityType,
  EntityTypeQuery,
  EntityTypeQueryVariables,
  EntityTypesWithFilterQuery,
  EntityTypesWithFilterQueryVariables,
  CreateEntityTypeMutation,
  CreateEntityTypeMutationVariables,
  CreateBulkCsvEntityTypeMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteEntityTypeMutation,
  DeleteEntityTypeMutationVariables,
  DeleteBulkEntityTypeMutation,
  DeleteBulkEntityTypeMutationVariables,
  UpdateEntityTypeMutation,
  UpdateEntityTypeMutationVariables,
  UpdateBulkEntityTypeMutation,
  UpdateBulkEntityTypeMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  ENTITY_TYPE,
  GET_ALL_ENTITY_TYPES,
  BULK_DELETE_ENTITY_TYPE,
  CREATE_ENTITY_TYPE,
  CREATE_CSV_BULK_ENTITY_TYPE,
  DELETE_ENTITY_TYPE,
  UPDATE_ENTITY_TYPE,
  BULK_EDIT_ENTITY_TYPE,
} from '@repo/codegen/query/entity-type'

type GetAllEntityTypesArgs = {
  where?: EntityTypesWithFilterQueryVariables['where']
  orderBy?: EntityTypesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useEntityTypesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllEntityTypesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<EntityTypesWithFilterQuery, unknown>({
    queryKey: ['entityTypes', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<EntityTypesWithFilterQuery> => {
      const result = await client.request(GET_ALL_ENTITY_TYPES, { where, orderBy, ...pagination?.query })
      return result as EntityTypesWithFilterQuery
    },
    enabled,
  })

  const EntityTypes = (queryResult.data?.entityTypes?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as EntityType[]

  return { ...queryResult, EntityTypes }
}

export const useCreateEntityType = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateEntityTypeMutation, unknown, CreateEntityTypeMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_ENTITY_TYPE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTypes'] })
    },
  })
}

export const useUpdateEntityType = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateEntityTypeMutation, unknown, UpdateEntityTypeMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_ENTITY_TYPE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTypes'] })
    },
  })
}

export const useDeleteEntityType = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteEntityTypeMutation, unknown, DeleteEntityTypeMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ENTITY_TYPE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTypes'] })
    },
  })
}

export const useEntityType = (entityTypeId?: EntityTypeQueryVariables['entityTypeId']) => {
  const { client } = useGraphQLClient()

  return useQuery<EntityTypeQuery, unknown>({
    queryKey: ['entityTypes', entityTypeId],
    queryFn: async (): Promise<EntityTypeQuery> => {
      const result = await client.request(ENTITY_TYPE, { entityTypeId })
      return result as EntityTypeQuery
    },
    enabled: !!entityTypeId,
  })
}

export const useCreateBulkCSVEntityType = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvEntityTypeMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_ENTITY_TYPE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTypes'] })
    },
  })
}

export const useBulkEditEntityType = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkEntityTypeMutation, unknown, UpdateBulkEntityTypeMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_ENTITY_TYPE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTypes'] })
    },
  })
}

export const useBulkDeleteEntityType = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkEntityTypeMutation, unknown, DeleteBulkEntityTypeMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_ENTITY_TYPE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityTypes'] })
    },
  })
}

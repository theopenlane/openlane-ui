import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Entity,
  EntityQuery,
  EntityQueryVariables,
  EntitiesWithFilterQuery,
  EntitiesWithFilterQueryVariables,
  CreateEntityMutation,
  CreateEntityMutationVariables,
  CreateBulkCsvEntityMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteEntityMutation,
  DeleteEntityMutationVariables,
  DeleteBulkEntityMutation,
  DeleteBulkEntityMutationVariables,
  UpdateEntityMutation,
  UpdateEntityMutationVariables,
  UpdateBulkEntityMutation,
  UpdateBulkEntityMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { ENTITY, GET_ALL_ENTITIES, BULK_DELETE_ENTITY, CREATE_ENTITY, CREATE_CSV_BULK_ENTITY, DELETE_ENTITY, UPDATE_ENTITY, BULK_EDIT_ENTITY } from '@repo/codegen/query/entity'

type GetAllEntitiesArgs = {
  where?: EntitiesWithFilterQueryVariables['where']
  orderBy?: EntitiesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useEntitiesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllEntitiesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<EntitiesWithFilterQuery, unknown>({
    queryKey: ['entities', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<EntitiesWithFilterQuery> => {
      const result = await client.request(GET_ALL_ENTITIES, { where, orderBy, ...pagination?.query })
      return result as EntitiesWithFilterQuery
    },
    enabled,
  })

  const Entities = (queryResult.data?.entities?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Entity[]

  return { ...queryResult, Entities }
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

  return useMutation<CreateBulkCsvEntityMutation, unknown, CreateBulkCsvTaskMutationVariables>({
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

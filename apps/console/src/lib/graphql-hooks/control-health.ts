import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ControlHealthsWithFilterQuery,
  type ControlHealthsWithFilterQueryVariables,
  type CreateControlHealthMutation,
  type CreateControlHealthMutationVariables,
  type UpdateControlHealthMutation,
  type UpdateControlHealthMutationVariables,
  type DeleteControlHealthMutation,
  type DeleteControlHealthMutationVariables,
  type ControlHealthQuery,
  type ControlHealthQueryVariables,
  type CreateBulkCsvControlHealthMutation,
  type CreateBulkCsvControlHealthMutationVariables,
  type UpdateBulkControlHealthMutation,
  type UpdateBulkControlHealthMutationVariables,
  type DeleteBulkControlHealthMutation,
  type DeleteBulkControlHealthMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_CONTROL_HEALTHS,
  CREATE_CONTROL_HEALTH,
  UPDATE_CONTROL_HEALTH,
  DELETE_CONTROL_HEALTH,
  CONTROL_HEALTH,
  CREATE_CSV_BULK_CONTROL_HEALTH,
  BULK_EDIT_CONTROL_HEALTH,
  BULK_DELETE_CONTROL_HEALTH,
} from '@repo/codegen/query/control-health'

type GetAllControlHealthsArgs = {
  where?: ControlHealthsWithFilterQueryVariables['where']
  orderBy?: ControlHealthsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ControlHealthsNode = NonNullable<NonNullable<NonNullable<ControlHealthsWithFilterQuery['controlHealths']>['edges']>[number]>['node']

export type ControlHealthsNodeNonNull = NonNullable<ControlHealthsNode>

export const useControlHealthsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllControlHealthsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ControlHealthsWithFilterQuery, unknown>({
    queryKey: ['controlHealths', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ControlHealthsWithFilterQuery> => {
      const result = await client.request<ControlHealthsWithFilterQuery>(GET_ALL_CONTROL_HEALTHS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.controlHealths?.edges ?? []

  const controlHealthsNodes: ControlHealthsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ControlHealthsNodeNonNull)

  return { ...queryResult, controlHealthsNodes }
}

export const useCreateControlHealth = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateControlHealthMutation, unknown, CreateControlHealthMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTROL_HEALTH, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlHealths'] })
    },
  })
}

export const useUpdateControlHealth = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateControlHealthMutation, unknown, UpdateControlHealthMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL_HEALTH, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlHealths'] })
    },
  })
}

export const useDeleteControlHealth = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteControlHealthMutation, unknown, DeleteControlHealthMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CONTROL_HEALTH, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlHealths'] })
    },
  })
}

export const useControlHealth = (controlHealthId?: ControlHealthQueryVariables['controlHealthId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ControlHealthQuery, unknown>({
    queryKey: ['controlHealths', controlHealthId],
    queryFn: async (): Promise<ControlHealthQuery> => {
      const result = await client.request(CONTROL_HEALTH, { controlHealthId })
      return result as ControlHealthQuery
    },
    enabled: !!controlHealthId,
  })
}

export const useCreateBulkCSVControlHealth = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvControlHealthMutation, unknown, CreateBulkCsvControlHealthMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_CONTROL_HEALTH, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlHealths'] })
    },
  })
}

export const useBulkEditControlHealth = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkControlHealthMutation, unknown, UpdateBulkControlHealthMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_CONTROL_HEALTH, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlHealths'] })
    },
  })
}

export const useBulkDeleteControlHealth = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkControlHealthMutation, unknown, DeleteBulkControlHealthMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_CONTROL_HEALTH, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlHealths'] })
    },
  })
}

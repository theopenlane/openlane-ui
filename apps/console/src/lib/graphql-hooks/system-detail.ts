import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type SystemDetailsWithFilterQuery,
  type SystemDetailsWithFilterQueryVariables,
  type CreateSystemDetailMutation,
  type CreateSystemDetailMutationVariables,
  type UpdateSystemDetailMutation,
  type UpdateSystemDetailMutationVariables,
  type DeleteSystemDetailMutation,
  type DeleteSystemDetailMutationVariables,
  type SystemDetailQuery,
  type SystemDetailQueryVariables,
  type CreateBulkCsvSystemDetailMutation,
  type CreateBulkCsvSystemDetailMutationVariables,
  type UpdateBulkSystemDetailMutation,
  type UpdateBulkSystemDetailMutationVariables,
  type DeleteBulkSystemDetailMutation,
  type DeleteBulkSystemDetailMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_SYSTEM_DETAILS,
  CREATE_SYSTEM_DETAIL,
  UPDATE_SYSTEM_DETAIL,
  DELETE_SYSTEM_DETAIL,
  SYSTEM_DETAIL,
  CREATE_CSV_BULK_SYSTEM_DETAIL,
  BULK_EDIT_SYSTEM_DETAIL,
  BULK_DELETE_SYSTEM_DETAIL,
} from '@repo/codegen/query/system-detail'

type GetAllSystemDetailsArgs = {
  where?: SystemDetailsWithFilterQueryVariables['where']
  orderBy?: SystemDetailsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type SystemDetailsNode = NonNullable<NonNullable<NonNullable<SystemDetailsWithFilterQuery['systemDetails']>['edges']>[number]>['node']

export type SystemDetailsNodeNonNull = NonNullable<SystemDetailsNode>

export const useSystemDetailsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllSystemDetailsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<SystemDetailsWithFilterQuery, unknown>({
    queryKey: ['systemDetails', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<SystemDetailsWithFilterQuery> => {
      const result = await client.request<SystemDetailsWithFilterQuery>(GET_ALL_SYSTEM_DETAILS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.systemDetails?.edges ?? []

  const systemDetailsNodes: SystemDetailsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as SystemDetailsNodeNonNull)

  return { ...queryResult, systemDetailsNodes }
}

export const useCreateSystemDetail = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateSystemDetailMutation, unknown, CreateSystemDetailMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SYSTEM_DETAIL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
    },
  })
}

export const useUpdateSystemDetail = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateSystemDetailMutation, unknown, UpdateSystemDetailMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SYSTEM_DETAIL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
    },
  })
}

export const useDeleteSystemDetail = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteSystemDetailMutation, unknown, DeleteSystemDetailMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SYSTEM_DETAIL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
    },
  })
}

export const useSystemDetail = (systemDetailId?: SystemDetailQueryVariables['systemDetailId']) => {
  const { client } = useGraphQLClient()
  return useQuery<SystemDetailQuery, unknown>({
    queryKey: ['systemDetails', systemDetailId],
    queryFn: async (): Promise<SystemDetailQuery> => {
      const result = await client.request<SystemDetailQuery>(SYSTEM_DETAIL, { systemDetailId })
      return result
    },
    enabled: !!systemDetailId,
  })
}

export const useCreateBulkCSVSystemDetail = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvSystemDetailMutation, unknown, CreateBulkCsvSystemDetailMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_SYSTEM_DETAIL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
    },
  })
}

export const useBulkEditSystemDetail = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkSystemDetailMutation, unknown, UpdateBulkSystemDetailMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_SYSTEM_DETAIL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
    },
  })
}

export const useBulkDeleteSystemDetail = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkSystemDetailMutation, unknown, DeleteBulkSystemDetailMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_SYSTEM_DETAIL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
    },
  })
}

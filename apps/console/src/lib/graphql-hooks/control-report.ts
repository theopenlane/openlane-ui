import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ControlReportsWithFilterQuery,
  type ControlReportsWithFilterQueryVariables,
  type CreateControlReportMutation,
  type CreateControlReportMutationVariables,
  type UpdateControlReportMutation,
  type UpdateControlReportMutationVariables,
  type DeleteControlReportMutation,
  type DeleteControlReportMutationVariables,
  type ControlReportQuery,
  type ControlReportQueryVariables,
  type UpdateBulkControlReportMutation,
  type UpdateBulkControlReportMutationVariables,
  type DeleteBulkControlReportMutation,
  type DeleteBulkControlReportMutationVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_CONTROL_REPORTS,
  CREATE_CONTROL_REPORT,
  UPDATE_CONTROL_REPORT,
  DELETE_CONTROL_REPORT,
  CONTROL_REPORT,
  BULK_EDIT_CONTROL_REPORT,
  BULK_DELETE_CONTROL_REPORT,
} from '@repo/codegen/query/control-report'

type GetAllControlReportsArgs = {
  where?: ControlReportsWithFilterQueryVariables['where']
  orderBy?: ControlReportsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ControlReportsNode = NonNullable<NonNullable<NonNullable<ControlReportsWithFilterQuery['controlReports']>['edges']>[number]>['node']

export type ControlReportsNodeNonNull = NonNullable<ControlReportsNode>

export const useControlReportsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllControlReportsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ControlReportsWithFilterQuery, unknown>({
    queryKey: ['controlReports', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ControlReportsWithFilterQuery> => {
      const result = await client.request<ControlReportsWithFilterQuery>(GET_ALL_CONTROL_REPORTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.controlReports?.edges ?? []

  const controlReportsNodes: ControlReportsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ControlReportsNodeNonNull)

  return { ...queryResult, controlReportsNodes }
}

export const useCreateControlReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateControlReportMutation, unknown, CreateControlReportMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CONTROL_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlReports'] })
    },
  })
}

export const useUpdateControlReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateControlReportMutation, unknown, UpdateControlReportMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlReports'] })
    },
  })
}

export const useDeleteControlReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteControlReportMutation, unknown, DeleteControlReportMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CONTROL_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlReports'] })
    },
  })
}

export const useControlReport = (controlReportId?: ControlReportQueryVariables['controlReportId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ControlReportQuery, unknown>({
    queryKey: ['controlReports', controlReportId],
    queryFn: async (): Promise<ControlReportQuery> => {
      const result = await client.request(CONTROL_REPORT, { controlReportId })
      return result as ControlReportQuery
    },
    enabled: !!controlReportId,
  })
}

export const useBulkEditControlReport = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkControlReportMutation, unknown, UpdateBulkControlReportMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_CONTROL_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlReports'] })
    },
  })
}

export const useBulkDeleteControlReport = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkControlReportMutation, unknown, DeleteBulkControlReportMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_CONTROL_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controlReports'] })
    },
  })
}

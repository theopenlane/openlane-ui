import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ReportsWithFilterQuery,
  type ReportsWithFilterQueryVariables,
  type CreateReportMutation,
  type CreateReportMutationVariables,
  type UpdateReportMutation,
  type UpdateReportMutationVariables,
  type DeleteReportMutation,
  type DeleteReportMutationVariables,
  type ReportQuery,
  type ReportQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_REPORTS, CREATE_REPORT, UPDATE_REPORT, DELETE_REPORT, REPORT } from '@repo/codegen/query/report'

type GetAllReportsArgs = {
  where?: ReportsWithFilterQueryVariables['where']
  orderBy?: ReportsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ReportsNode = NonNullable<NonNullable<NonNullable<ReportsWithFilterQuery['reports']>['edges']>[number]>['node']

export type ReportsNodeNonNull = NonNullable<ReportsNode>

export const useReportsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllReportsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ReportsWithFilterQuery, unknown>({
    queryKey: ['reports', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ReportsWithFilterQuery> => {
      const result = await client.request<ReportsWithFilterQuery>(GET_ALL_REPORTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.reports?.edges ?? []

  const reportsNodes: ReportsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ReportsNodeNonNull)

  return { ...queryResult, reportsNodes }
}

export const useCreateReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateReportMutation, unknown, CreateReportMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export const useUpdateReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateReportMutation, unknown, UpdateReportMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export const useDeleteReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteReportMutation, unknown, DeleteReportMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_REPORT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

export const useReport = (reportId?: ReportQueryVariables['reportId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ReportQuery, unknown>({
    queryKey: ['reports', reportId],
    queryFn: async (): Promise<ReportQuery> => {
      const result = await client.request(REPORT, { reportId })
      return result as ReportQuery
    },
    enabled: !!reportId,
  })
}

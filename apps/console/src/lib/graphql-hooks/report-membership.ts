import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ReportMembershipsWithFilterQuery,
  type ReportMembershipsWithFilterQueryVariables,
  type CreateReportMembershipMutation,
  type CreateReportMembershipMutationVariables,
  type UpdateReportMembershipMutation,
  type UpdateReportMembershipMutationVariables,
  type DeleteReportMembershipMutation,
  type DeleteReportMembershipMutationVariables,
  type ReportMembershipQuery,
  type ReportMembershipQueryVariables,
  type UpdateBulkReportMembershipMutation,
  type UpdateBulkReportMembershipMutationVariables,
  type DeleteBulkReportMembershipMutation,
  type DeleteBulkReportMembershipMutationVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_REPORT_MEMBERSHIPS,
  CREATE_REPORT_MEMBERSHIP,
  UPDATE_REPORT_MEMBERSHIP,
  DELETE_REPORT_MEMBERSHIP,
  REPORT_MEMBERSHIP,
  BULK_EDIT_REPORT_MEMBERSHIP,
  BULK_DELETE_REPORT_MEMBERSHIP,
} from '@repo/codegen/query/report-membership'

type GetAllReportMembershipsArgs = {
  where?: ReportMembershipsWithFilterQueryVariables['where']
  orderBy?: ReportMembershipsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ReportMembershipsNode = NonNullable<NonNullable<NonNullable<ReportMembershipsWithFilterQuery['reportMemberships']>['edges']>[number]>['node']

export type ReportMembershipsNodeNonNull = NonNullable<ReportMembershipsNode>

export const useReportMembershipsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllReportMembershipsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ReportMembershipsWithFilterQuery, unknown>({
    queryKey: ['reportMemberships', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ReportMembershipsWithFilterQuery> => {
      const result = await client.request<ReportMembershipsWithFilterQuery>(GET_ALL_REPORT_MEMBERSHIPS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.reportMemberships?.edges ?? []

  const reportMembershipsNodes: ReportMembershipsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ReportMembershipsNodeNonNull)

  return { ...queryResult, reportMembershipsNodes }
}

export const useCreateReportMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateReportMembershipMutation, unknown, CreateReportMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_REPORT_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportMemberships'] })
    },
  })
}

export const useUpdateReportMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateReportMembershipMutation, unknown, UpdateReportMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_REPORT_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportMemberships'] })
    },
  })
}

export const useDeleteReportMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteReportMembershipMutation, unknown, DeleteReportMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_REPORT_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportMemberships'] })
    },
  })
}

export const useReportMembership = (reportMembershipId?: ReportMembershipQueryVariables['reportMembershipId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ReportMembershipQuery, unknown>({
    queryKey: ['reportMemberships', reportMembershipId],
    queryFn: async (): Promise<ReportMembershipQuery> => {
      const result = await client.request(REPORT_MEMBERSHIP, { reportMembershipId })
      return result as ReportMembershipQuery
    },
    enabled: !!reportMembershipId,
  })
}

export const useBulkEditReportMembership = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkReportMembershipMutation, unknown, UpdateBulkReportMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_REPORT_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportMemberships'] })
    },
  })
}

export const useBulkDeleteReportMembership = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkReportMembershipMutation, unknown, DeleteBulkReportMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_REPORT_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportMemberships'] })
    },
  })
}

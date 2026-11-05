import { useMutation, useQuery } from '@tanstack/react-query'
import { GET_REPORT_VIEWER_GROUPS } from '@repo/codegen/query/report'
import { CREATE_BULK_REPORT_MEMBERSHIP, DELETE_REPORT_MEMBERSHIP, GET_REPORT_MEMBERS } from '@repo/codegen/query/report-membership'
import {
  type CreateBulkReportMembershipMutation,
  type CreateBulkReportMembershipMutationVariables,
  type DeleteReportMembershipMutation,
  type DeleteReportMembershipMutationVariables,
  type GetReportMembersQuery,
  type GetReportMembersQueryVariables,
  type GetReportViewerGroupsQuery,
  type GetReportViewerGroupsQueryVariables,
} from '@repo/codegen/src/schema'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { fetchAllConnectionNodes } from './fetch-all-connection-nodes'
import type { TReportViewerGroup } from './report'

type TReportMembershipNode = NonNullable<NonNullable<NonNullable<GetReportMembersQuery['report']['members']['edges']>[number]>['node']>

export type TReportSharing = {
  memberships: TReportMembershipNode[]
  groups: TReportViewerGroup[]
}

export const useReportSharing = (reportId: string | null | undefined) => {
  const { client } = useGraphQLClient()

  return useQuery<TReportSharing>({
    queryKey: ['reports', 'sharing', reportId],
    enabled: !!reportId,
    placeholderData: undefined,
    queryFn: async () => {
      const id = reportId ?? ''
      const [memberships, groups] = await Promise.all([
        fetchAllConnectionNodes<TReportMembershipNode>(
          async (after) => (await client.request<GetReportMembersQuery, GetReportMembersQueryVariables>(GET_REPORT_MEMBERS, { reportId: id, first: EXPORT_PAGE_SIZE, after })).report.members,
        ),
        fetchAllConnectionNodes<TReportViewerGroup>(
          async (after) =>
            (await client.request<GetReportViewerGroupsQuery, GetReportViewerGroupsQueryVariables>(GET_REPORT_VIEWER_GROUPS, { reportId: id, first: EXPORT_PAGE_SIZE, after })).report.viewers,
        ),
      ])

      return { memberships, groups }
    },
  })
}

export const useCreateBulkReportMembership = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateBulkReportMembershipMutation, unknown, CreateBulkReportMembershipMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_BULK_REPORT_MEMBERSHIP, variables),
  })
}

export const useDeleteReportMembership = () => {
  const { client } = useGraphQLClient()

  return useMutation<DeleteReportMembershipMutation, unknown, DeleteReportMembershipMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_REPORT_MEMBERSHIP, variables),
  })
}

import { useMemo } from 'react'
import { type InfiniteData, type QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CREATE_REPORT, DELETE_REPORT, GET_ALL_REPORTS, GET_REPORT, UPDATE_REPORT } from '@repo/codegen/query/report'
import {
  type CreateReportMutation,
  type CreateReportMutationVariables,
  type DeleteReportMutation,
  type DeleteReportMutationVariables,
  type GetAllReportsQuery,
  type GetAllReportsQueryVariables,
  type GetReportQuery,
  type GetReportQueryVariables,
  type GetReportViewerGroupsQuery,
  OrderDirection,
  ReportOrderField,
  ReportReportStatus,
  type UpdateReportMutation,
  type UpdateReportMutationVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { getNodes } from './connection'

export type TSavedReportNode = NonNullable<NonNullable<NonNullable<NonNullable<GetAllReportsQuery['reports']>['edges']>[number]>['node']>

export type TSavedReportRef = Pick<TSavedReportNode, 'id' | 'name' | 'visibility' | 'variables'>

export type TReportViewerGroup = NonNullable<NonNullable<NonNullable<GetReportViewerGroupsQuery['report']['viewers']['edges']>[number]>['node']>

const SAVED_REPORTS_SHEET_PAGE_SIZE = 25

const REPORTS_ORDER: GetAllReportsQueryVariables['orderBy'] = [{ field: ReportOrderField.name, direction: OrderDirection.ASC }]

const savedReportsWhere = (search: string): NonNullable<GetAllReportsQueryVariables['where']> => ({ status: ReportReportStatus.SAVED, ...(search ? { nameContainsFold: search } : {}) })

export const invalidateReportQueries = (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: ['reports'] })

export const useGetSavedReports = ({ search, pagination }: { search: string; pagination: TPagination }) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllReportsQuery>({
    queryKey: ['reports', 'list', search, pagination.page, pagination.pageSize],
    queryFn: () => client.request<GetAllReportsQuery, GetAllReportsQueryVariables>(GET_ALL_REPORTS, { where: savedReportsWhere(search), orderBy: REPORTS_ORDER, ...pagination.query }),
  })

  const reports = useMemo(() => getNodes(queryResult.data?.reports), [queryResult.data])
  const paginationMeta = { totalCount: queryResult.data?.reports?.totalCount ?? 0, pageInfo: queryResult.data?.reports?.pageInfo, isLoading: queryResult.isFetching }

  return { ...queryResult, reports, paginationMeta }
}

export const useGetSavedReportsInfinite = (search: string) => {
  const { client } = useGraphQLClient()

  const queryResult = useInfiniteQuery<GetAllReportsQuery, Error, InfiniteData<GetAllReportsQuery>, readonly unknown[], string | undefined>({
    queryKey: ['reports', 'infinite', search],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) =>
      client.request<GetAllReportsQuery, GetAllReportsQueryVariables>(GET_ALL_REPORTS, {
        where: savedReportsWhere(search),
        orderBy: REPORTS_ORDER,
        first: SAVED_REPORTS_SHEET_PAGE_SIZE,
        after: pageParam,
      }),
    getNextPageParam: (lastPage) => (lastPage.reports.pageInfo.hasNextPage ? (lastPage.reports.pageInfo.endCursor ?? undefined) : undefined),
  })

  const reports = useMemo(() => queryResult.data?.pages.flatMap((page) => getNodes(page.reports)) ?? [], [queryResult.data])
  const totalCount = queryResult.data?.pages.at(-1)?.reports.totalCount ?? 0

  return { ...queryResult, reports, totalCount }
}

export const useGetReport = (reportId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetReportQuery>({
    queryKey: ['reports', 'detail', reportId],
    queryFn: () => client.request<GetReportQuery, GetReportQueryVariables>(GET_REPORT, { reportId: reportId ?? '' }),
    enabled: !!reportId,
    retry: false,
    placeholderData: undefined,
  })
}

export const useCreateReport = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateReportMutation, unknown, CreateReportMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_REPORT, variables),
  })
}

export const useUpdateReport = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateReportMutation, unknown, UpdateReportMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_REPORT, variables),
  })
}

export const useDeleteReport = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteReportMutation, unknown, DeleteReportMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_REPORT, variables),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['reports', 'infinite'] })
    },
  })
}

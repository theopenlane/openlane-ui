import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ScansWithFilterQuery,
  type ScansWithFilterQueryVariables,
  type CreateScanMutation,
  type CreateScanMutationVariables,
  type UpdateScanMutation,
  type UpdateScanMutationVariables,
  type DeleteScanMutation,
  type DeleteScanMutationVariables,
  type ScanQuery,
  type ScanQueryVariables,
  type ScanStatusQuery,
  type ScanStatusQueryVariables,
  type RecentDomainScansQuery,
  type RecentDomainScansQueryVariables,
  ScanScanStatus,
  type CreateBulkCsvScanMutation,
  type CreateBulkCsvScanMutationVariables,
  type UpdateBulkScanMutation,
  type UpdateBulkScanMutationVariables,
  type DeleteBulkScanMutation,
  type DeleteBulkScanMutationVariables,
  type GetScanAssociationsQuery,
  type ImportDomainScanReviewMutation,
  type ImportDomainScanReviewMutationVariables,
} from '@repo/codegen/src/schema'
import { type ClientError } from 'graphql-request'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_SCANS,
  CREATE_SCAN,
  UPDATE_SCAN,
  DELETE_SCAN,
  SCAN,
  SCAN_STATUS,
  RECENT_DOMAIN_SCANS,
  CREATE_CSV_BULK_SCAN,
  BULK_EDIT_SCAN,
  BULK_DELETE_SCAN,
  GET_SCAN_ASSOCIATIONS,
  IMPORT_DOMAIN_SCAN_REVIEW,
} from '@repo/codegen/query/scan'

type GetAllScansArgs = {
  where?: ScansWithFilterQueryVariables['where']
  orderBy?: ScansWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ScansNode = NonNullable<NonNullable<NonNullable<ScansWithFilterQuery['scans']>['edges']>[number]>['node']

export type ScansNodeNonNull = NonNullable<ScansNode>

export type ScanDetailNode = NonNullable<ScanQuery['scan']>

export const useScansWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllScansArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ScansWithFilterQuery, unknown>({
    queryKey: ['scans', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ScansWithFilterQuery> => {
      const result = await client.request<ScansWithFilterQuery>(GET_ALL_SCANS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.scans?.edges ?? []

  const scansNodes: ScansNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ScansNodeNonNull)

  return { ...queryResult, scansNodes }
}

export const useCreateScan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateScanMutation, unknown, CreateScanMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useUpdateScan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateScanMutation, unknown, UpdateScanMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useImportDomainScanReview = () => {
  const { client } = useGraphQLClient()
  return useMutation<ImportDomainScanReviewMutation, ClientError, ImportDomainScanReviewMutationVariables>({
    mutationFn: async (variables) => client.request(IMPORT_DOMAIN_SCAN_REVIEW, variables),
  })
}

export const useDeleteScan = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteScanMutation, unknown, DeleteScanMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useScan = (scanId?: ScanQueryVariables['scanId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ScanQuery, unknown>({
    queryKey: ['scans', scanId],
    queryFn: async (): Promise<ScanQuery> => {
      const result = await client.request(SCAN, { scanId })
      return result as ScanQuery
    },
    enabled: !!scanId,
  })
}

export type RecentDomainScanNode = NonNullable<NonNullable<NonNullable<RecentDomainScansQuery['scans']>['edges']>[number]>['node']

const RECENT_DOMAIN_SCANS_POLL_INTERVAL_MS = 5000 // 5s

const hasActiveDomainScan = (data?: RecentDomainScansQuery) =>
  (data?.scans?.edges ?? []).some((edge) => edge?.node?.status === ScanScanStatus.PENDING || edge?.node?.status === ScanScanStatus.PROCESSING)

export const useRecentDomainScans = ({ where, first, enabled = true }: RecentDomainScansQueryVariables & { enabled?: boolean }) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<RecentDomainScansQuery, ClientError>({
    queryKey: ['scans', 'recent-domain', where, first],
    queryFn: async (): Promise<RecentDomainScansQuery> => client.request(RECENT_DOMAIN_SCANS, { where, first }),
    enabled,
    placeholderData: undefined,
    refetchInterval: (query) => (hasActiveDomainScan(query.state.data) ? RECENT_DOMAIN_SCANS_POLL_INTERVAL_MS : false),
  })

  const scans = (queryResult.data?.scans?.edges ?? []).map((edge) => edge?.node).filter((node): node is NonNullable<RecentDomainScanNode> => !!node)

  return { ...queryResult, scans }
}

const SCAN_STATUS_POLL_INTERVAL_MS = 3000 // 3s

const isTerminalScanStatus = (status?: ScanScanStatus) => status === ScanScanStatus.COMPLETED || status === ScanScanStatus.FAILED

export const useScanStatus = (scanId?: ScanStatusQueryVariables['scanId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ScanStatusQuery, ClientError>({
    queryKey: ['scans', scanId, 'status'],
    queryFn: async (): Promise<ScanStatusQuery> => client.request(SCAN_STATUS, { scanId }),
    enabled: !!scanId,
    placeholderData: undefined,
    refetchInterval: (query) => (query.state.status === 'error' || isTerminalScanStatus(query.state.data?.scan?.status) ? false : SCAN_STATUS_POLL_INTERVAL_MS),
    refetchIntervalInBackground: true,
  })
}

export const useCreateBulkCSVScan = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvScanMutation, unknown, CreateBulkCsvScanMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_SCAN, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useBulkEditScan = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkScanMutation, unknown, UpdateBulkScanMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useBulkDeleteScan = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkScanMutation, unknown, DeleteBulkScanMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_SCAN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export const useGetScanAssociations = (scanId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetScanAssociationsQuery, unknown>({
    queryKey: ['scans', scanId, 'associations'],
    queryFn: async (): Promise<GetScanAssociationsQuery> => {
      return client.request(GET_SCAN_ASSOCIATIONS, { scanId })
    },
    enabled: !!scanId,
  })
}

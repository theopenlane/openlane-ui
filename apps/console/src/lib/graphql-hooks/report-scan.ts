import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { chunk } from '@/utils/async'
import { useScansWithFilter } from '@/lib/graphql-hooks/scan'
import {
  ScanScanStatus,
  ScanScanType,
  type CreateReportScanMutation,
  type CreateReportScanMutationVariables,
  type ReportScanExistingRecordsQuery,
  type ReportScanExistingRecordsQueryVariables,
} from '@repo/codegen/src/schema'
import { CREATE_REPORT_SCAN, REPORT_SCAN_EXISTING_RECORDS } from '@repo/codegen/query/scan'

const REPORT_SCAN_PAGE_SIZE = 100

const ACTIVE_REPORT_SCAN_WINDOW_MS = 60 * 60 * 1000 // 1hr

export const REPORT_SCAN_PERFORMER = 'openlane_report_parse'

export const useActiveReportScan = () => {
  const [since] = useState(() => new Date(Date.now() - ACTIVE_REPORT_SCAN_WINDOW_MS).toISOString())
  const { scansNodes, isPending } = useScansWithFilter({
    where: { scanType: ScanScanType.REPORT, performedBy: REPORT_SCAN_PERFORMER, statusIn: [ScanScanStatus.PENDING, ScanScanStatus.PROCESSING], createdAtGT: since },
  })
  return { activeReportScan: scansNodes[0], isPending }
}

export const useCreateReportScan = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateReportScanMutation, unknown, CreateReportScanMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_REPORT_SCAN, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
    },
  })
}

export type ReportScanLookupNames = {
  platforms: string[]
  vendors: string[]
  assets: string[]
  groups: string[]
  controls: string[]
}

export type ReportScanExistingIds = Record<keyof ReportScanLookupNames, Record<string, string>>

export const emptyReportScanExistingIds = (): ReportScanExistingIds => ({ platforms: {}, vendors: {}, assets: {}, groups: {}, controls: {} })

type ExistingEdges = ({ node?: { id: string; name?: string | null; refCode?: string | null } | null } | null)[] | null | undefined

export const existingNameKey = (name: string) => name.trim().toLowerCase()

const indexNodes = (edges: ExistingEdges, into: Record<string, string>) =>
  (edges ?? []).forEach((edge) => {
    const name = edge?.node?.name
    if (edge?.node && name) into[existingNameKey(name)] = edge.node.id
  })

const indexControls = (edges: ExistingEdges, into: Record<string, string>) =>
  (edges ?? []).forEach((edge) => {
    const refCode = edge?.node?.refCode
    if (edge?.node && refCode) into[refCode] = edge.node.id
  })

export const useReportScanExistingRecords = (names: ReportScanLookupNames) => {
  const { client } = useGraphQLClient()

  return useQuery<ReportScanExistingIds>({
    queryKey: ['scans', 'report-existing-records', names],
    placeholderData: undefined,
    queryFn: async () => {
      const result = emptyReportScanExistingIds()
      const batches = {
        platforms: chunk(names.platforms, REPORT_SCAN_PAGE_SIZE),
        vendors: chunk(names.vendors, REPORT_SCAN_PAGE_SIZE),
        assets: chunk(names.assets, REPORT_SCAN_PAGE_SIZE),
        groups: chunk(names.groups, REPORT_SCAN_PAGE_SIZE),
        controls: chunk(names.controls, REPORT_SCAN_PAGE_SIZE),
      }
      const batchCount = Math.max(0, ...Object.values(batches).map((list) => list.length))

      for (let batch = 0; batch < batchCount; batch++) {
        const response = await client.request<ReportScanExistingRecordsQuery, ReportScanExistingRecordsQueryVariables>(REPORT_SCAN_EXISTING_RECORDS, {
          platformNames: batches.platforms[batch],
          vendorNames: batches.vendors[batch],
          assetNames: batches.assets[batch],
          groupNames: batches.groups[batch],
          controlRefCodes: batches.controls[batch],
          withPlatforms: !!batches.platforms[batch],
          withVendors: !!batches.vendors[batch],
          withAssets: !!batches.assets[batch],
          withGroups: !!batches.groups[batch],
          withControls: !!batches.controls[batch],
          first: REPORT_SCAN_PAGE_SIZE,
        })

        indexNodes(response.platforms?.edges, result.platforms)
        indexNodes(response.entities?.edges, result.vendors)
        indexNodes(response.assets?.edges, result.assets)
        indexNodes(response.groups?.edges, result.groups)
        indexControls(response.controls?.edges, result.controls)
      }

      return result
    },
  })
}

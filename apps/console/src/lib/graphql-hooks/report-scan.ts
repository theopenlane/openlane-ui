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
import { SCAN_PERFORMER, SOC2_REPORT_DOCUMENT_KIND, type TReportScanPerformer, type TReportScanSection } from '@/constants/scan-performers'
import { NO_SCAN_PERMISSION_REASON, SCAN_PERMISSION_UNKNOWN_REASON, useCanCreateScan } from '@/hooks/useCanCreateScan'

const REPORT_SCAN_PAGE_SIZE = 100

const ACTIVE_REPORT_SCAN_WINDOW_MS = 60 * 60 * 1000 // 1hr

export type TReportScanFile = { kind: 'upload'; file: File } | { kind: 'existing'; fileId: string; fileName: string }

export type TReportScanRequest = {
  performer: TReportScanPerformer
  report: TReportScanFile
  vendorId?: string
  sections?: readonly TReportScanSection[]
}

const reportScanTarget = (report: TReportScanFile) => (report.kind === 'upload' ? report.file.name : report.fileName)

export const buildReportScanVariables = ({ performer, report, vendorId, sections }: TReportScanRequest): CreateReportScanMutationVariables => ({
  input: {
    scanType: ScanScanType.REPORT,
    performedBy: performer,
    documentKindName: SOC2_REPORT_DOCUMENT_KIND,
    target: reportScanTarget(report),
    ...(vendorId ? { entityIDs: [vendorId] } : {}),
    ...(report.kind === 'existing' ? { fileIDs: [report.fileId] } : {}),
    ...(sections?.length ? { metadata: { parts: [...sections] } } : {}),
  },
  ...(report.kind === 'upload' ? { scanFiles: [report.file] } : {}),
})

const REPORT_SCAN_RUNNING_REASON: Record<TReportScanPerformer, (target: string) => string> = {
  [SCAN_PERFORMER.REPORT_PARSE]: (target) => `We're still reading ${target}. You'll get a notification when it's ready, then you can import another report.`,
  [SCAN_PERFORMER.VENDOR_REPORT_REVIEW]: (target) => `We're still reviewing ${target}. You'll get a notification when it's done, then you can review another vendor report.`,
}

export const REPORT_SCAN_STARTED_NOTIFICATION: Record<TReportScanPerformer, { title: string; description: string }> = {
  [SCAN_PERFORMER.REPORT_PARSE]: { title: 'Processing your report', description: 'Most reports are ready in about 15 minutes. We’ll notify you when yours is ready to review.' },
  [SCAN_PERFORMER.VENDOR_REPORT_REVIEW]: { title: 'Reviewing the report', description: 'Most reviews are done in about 15 minutes. We’ll notify you when the results are on the vendor.' },
}

export const useActiveReportScan = (performer: TReportScanPerformer, enabled = true) => {
  const [since] = useState(() => new Date(Date.now() - ACTIVE_REPORT_SCAN_WINDOW_MS).toISOString())
  const { scansNodes, isPending } = useScansWithFilter({
    where: { scanType: ScanScanType.REPORT, performedBy: performer, statusIn: [ScanScanStatus.PENDING, ScanScanStatus.PROCESSING], createdAtGT: since },
    enabled,
  })
  return { activeReportScan: enabled ? scansNodes[0] : undefined, isPending: enabled && isPending }
}

export const useReportScanAvailability = (performer: TReportScanPerformer, enabled = true) => {
  const { canCreateScan, isCheckingPermission, isPermissionError } = useCanCreateScan()
  const { activeReportScan, isPending: isCheckingActiveScan } = useActiveReportScan(performer, enabled && canCreateScan)
  const permissionReason = isPermissionError ? SCAN_PERMISSION_UNKNOWN_REASON : NO_SCAN_PERMISSION_REASON
  const blockedReason = !isCheckingPermission && !canCreateScan ? permissionReason : activeReportScan ? REPORT_SCAN_RUNNING_REASON[performer](activeReportScan.target) : undefined
  const isChecking = isCheckingPermission || isCheckingActiveScan

  return { canStart: !isChecking && !blockedReason, isChecking, isPermitted: canCreateScan, blockedReason }
}

export const useCreateReportScan = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateReportScanMutation, unknown, TReportScanRequest>({
    mutationFn: async (request) => fetchGraphQLWithUpload({ query: CREATE_REPORT_SCAN, variables: buildReportScanVariables(request) }),
    onSuccess: (_data, request) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] })
      if (request.vendorId && request.report.kind === 'upload') {
        queryClient.invalidateQueries({ queryKey: ['entityFiles', request.vendorId] })
        queryClient.invalidateQueries({ queryKey: ['entities', request.vendorId] })
      }
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

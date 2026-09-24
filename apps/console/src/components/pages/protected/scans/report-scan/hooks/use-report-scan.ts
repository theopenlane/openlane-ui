'use client'

import { useEffect, useMemo } from 'react'
import { ScanScanStatus, ScanScanType } from '@repo/codegen/src/schema'
import { isActiveScanStatus, useScan, useScanStatus } from '@/lib/graphql-hooks/scan'
import { parseReport, reportScanErrorOf } from '../parse-report'

export const useReportScan = (scanId?: string) => {
  const { data, isPending, isError, refetch } = useScan(scanId)
  const scan = data?.scan?.scanType === ScanScanType.REPORT ? data.scan : undefined
  const isProcessing = isActiveScanStatus(scan?.status)
  const { data: statusData } = useScanStatus(isProcessing ? scanId : undefined)
  const liveStatus = statusData?.scan?.status

  useEffect(() => {
    if (isProcessing && liveStatus && !isActiveScanStatus(liveStatus)) {
      refetch()
    }
  }, [isProcessing, liveStatus, refetch])

  const report = useMemo(() => (scan?.status === ScanScanStatus.COMPLETED ? parseReport(scan.metadata) : undefined), [scan])

  return {
    scan,
    report,
    reportName: scan?.target ?? '',
    isLoading: !!scanId && isPending,
    isNotFound: !scanId || isError || (!isPending && !scan),
    isProcessing,
    isFailed: scan?.status === ScanScanStatus.FAILED,
    isAlreadyImported: !!scan?.reviewedByUser,
    failureReason: reportScanErrorOf(scan?.metadata),
  }
}

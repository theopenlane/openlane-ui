import { ScanScanType } from '@repo/codegen/src/schema'

export const REPORT_SCAN_UPLOAD_PARAM = 'report-scan'

export const REPORT_SCAN_TASK_PARAM = 'report-scan-task'

export const SCANS_ROUTE = '/exposure/scans'

type TReviewableScanType = ScanScanType.DOMAIN | ScanScanType.REPORT

const SCAN_REVIEW_ROUTES: Record<TReviewableScanType, string> = {
  [ScanScanType.DOMAIN]: `${SCANS_ROUTE}/domain-scan`,
  [ScanScanType.REPORT]: `${SCANS_ROUTE}/report-scan`,
}

export const isReviewableScanType = (scanType: ScanScanType): scanType is TReviewableScanType => Object.hasOwn(SCAN_REVIEW_ROUTES, scanType)

export const scanReviewHref = (scanType: TReviewableScanType, scanId: string) => `${SCAN_REVIEW_ROUTES[scanType]}?scanId=${encodeURIComponent(scanId)}`

export const withSuggestedTaskParam = (link: string, taskId: string) => {
  const [path, query = ''] = link.split('?')
  const params = new URLSearchParams(query)
  if (!params.has(REPORT_SCAN_UPLOAD_PARAM)) return link
  params.set(REPORT_SCAN_TASK_PARAM, taskId)
  return `${path}?${params}`
}

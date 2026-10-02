'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { REPORT_SCAN_TASK_PARAM, REPORT_SCAN_UPLOAD_PARAM } from '@/constants/scan-routes'

const ReportScanUploadSheet = dynamic(() => import('@/components/pages/protected/scans/report-scan/upload/report-scan-upload-sheet').then((mod) => mod.ReportScanUploadSheet), { ssr: false })

export const ReportScanUploadHost = () => {
  const searchParams = useSearchParams()
  const { replace } = useSmartRouter()

  if (!searchParams.has(REPORT_SCAN_UPLOAD_PARAM)) return null

  return <ReportScanUploadSheet suggestedTaskId={searchParams.get(REPORT_SCAN_TASK_PARAM) ?? undefined} onClose={() => replace({ [REPORT_SCAN_UPLOAD_PARAM]: null, [REPORT_SCAN_TASK_PARAM]: null })} />
}

'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { REPORT_SCAN_TASK_PARAM, REPORT_SCAN_UPLOAD_PARAM } from '@/constants/scan-routes'
import { LazyReportScanUploadSheet } from './lazy-report-scan-upload-sheet'

export const ReportScanUploadHost = () => {
  const searchParams = useSearchParams()
  const { replace } = useSmartRouter()

  if (!searchParams.has(REPORT_SCAN_UPLOAD_PARAM)) return null

  return (
    <LazyReportScanUploadSheet
      mode={{ kind: 'own', suggestedTaskId: searchParams.get(REPORT_SCAN_TASK_PARAM) ?? undefined }}
      onClose={() => replace({ [REPORT_SCAN_UPLOAD_PARAM]: null, [REPORT_SCAN_TASK_PARAM]: null })}
    />
  )
}

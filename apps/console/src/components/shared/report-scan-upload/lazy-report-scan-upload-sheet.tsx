'use client'

import dynamic from 'next/dynamic'

export const LazyReportScanUploadSheet = dynamic(() => import('@/components/pages/protected/scans/report-scan/upload/report-scan-upload-sheet').then((mod) => mod.ReportScanUploadSheet), {
  ssr: false,
})

import React from 'react'
import type { Metadata } from 'next'
import ReportScanImportPage from '@/components/pages/protected/scans/report-scan/report-scan-import-page'

export const metadata: Metadata = {
  title: 'Report Import',
}

const Page: React.FC = () => <ReportScanImportPage />

export default Page

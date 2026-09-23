import React from 'react'
import { type Metadata } from 'next'
import ScanImportPage from '@/components/pages/protected/scans/import/scan-import-page'

export const metadata: Metadata = {
  title: 'Import Scans',
}

const Page: React.FC = () => <ScanImportPage />

export default Page

import React from 'react'
import { type Metadata } from 'next'
import VulnerabilityImportPage from '@/components/pages/protected/vulnerabilities/import/vulnerability-import-page'

export const metadata: Metadata = {
  title: 'Import Vulnerabilities',
}

const Page: React.FC = () => <VulnerabilityImportPage />

export default Page

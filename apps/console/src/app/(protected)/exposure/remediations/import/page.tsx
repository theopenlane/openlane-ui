import React from 'react'
import { type Metadata } from 'next'
import RemediationImportPage from '@/components/pages/protected/remediations/import/remediation-import-page'

export const metadata: Metadata = {
  title: 'Import Remediations',
}

const Page: React.FC = () => <RemediationImportPage />

export default Page

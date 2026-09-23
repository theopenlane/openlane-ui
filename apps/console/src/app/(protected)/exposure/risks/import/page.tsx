import React from 'react'
import { type Metadata } from 'next'
import RiskImportPage from '@/components/pages/protected/risks/import/risk-import-page'

export const metadata: Metadata = {
  title: 'Import Risks',
}

const Page: React.FC = () => <RiskImportPage />

export default Page

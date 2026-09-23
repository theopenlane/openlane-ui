import React from 'react'
import { type Metadata } from 'next'
import FindingImportPage from '@/components/pages/protected/findings/import/finding-import-page'

export const metadata: Metadata = {
  title: 'Import Findings',
}

const Page: React.FC = () => <FindingImportPage />

export default Page

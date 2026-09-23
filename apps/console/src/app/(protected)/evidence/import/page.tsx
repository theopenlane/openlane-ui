import React from 'react'
import { type Metadata } from 'next'
import EvidenceImportPage from '@/components/pages/protected/evidence/import/evidence-import-page'

export const metadata: Metadata = {
  title: 'Import Evidence',
}

const Page: React.FC = () => <EvidenceImportPage />

export default Page

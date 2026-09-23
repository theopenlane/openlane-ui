import React from 'react'
import { type Metadata } from 'next'
import SystemDetailImportPage from '@/components/pages/protected/system-details/import/system-detail-import-page'

export const metadata: Metadata = {
  title: 'Import System Details',
}

const Page: React.FC = () => <SystemDetailImportPage />

export default Page

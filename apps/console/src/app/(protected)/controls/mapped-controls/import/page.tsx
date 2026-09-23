import React from 'react'
import { type Metadata } from 'next'
import MappedControlImportPage from '@/components/pages/protected/controls/import/mapped-control-import-page'

export const metadata: Metadata = {
  title: 'Import Control Mappings',
}

const Page: React.FC = () => <MappedControlImportPage />

export default Page

import React from 'react'
import { type Metadata } from 'next'
import ProcedureImportPage from '@/components/pages/protected/procedures/import/procedure-import-page'

export const metadata: Metadata = {
  title: 'Import Procedures',
}

const Page: React.FC = () => <ProcedureImportPage />

export default Page

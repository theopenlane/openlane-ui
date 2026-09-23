import React from 'react'
import { type Metadata } from 'next'
import PersonnelImportPage from '@/components/pages/protected/personnel/import/personnel-import-page'

export const metadata: Metadata = {
  title: 'Import Personnel',
}

const Page: React.FC = () => <PersonnelImportPage />

export default Page

import React from 'react'
import { type Metadata } from 'next'
import ControlImportPage from '@/components/pages/protected/controls/import/control-import-page'

export const metadata: Metadata = {
  title: 'Import Controls',
}

const Page: React.FC = () => <ControlImportPage />

export default Page

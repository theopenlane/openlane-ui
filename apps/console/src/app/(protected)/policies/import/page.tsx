import React from 'react'
import { type Metadata } from 'next'
import PolicyImportPage from '@/components/pages/protected/policies/import/policy-import-page'

export const metadata: Metadata = {
  title: 'Import Policies',
}

const Page: React.FC = () => <PolicyImportPage />

export default Page

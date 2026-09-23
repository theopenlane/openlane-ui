import React from 'react'
import { type Metadata } from 'next'
import GroupImportPage from '@/components/pages/protected/groups/import/group-import-page'

export const metadata: Metadata = {
  title: 'Import Groups',
}

const Page: React.FC = () => <GroupImportPage />

export default Page

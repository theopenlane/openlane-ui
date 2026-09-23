import React from 'react'
import { type Metadata } from 'next'
import AssetImportPage from '@/components/pages/protected/assets/import/asset-import-page'

export const metadata: Metadata = {
  title: 'Import Assets',
}

const Page: React.FC = () => <AssetImportPage />

export default Page

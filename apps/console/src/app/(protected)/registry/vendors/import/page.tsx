import React from 'react'
import { type Metadata } from 'next'
import VendorImportPage from '@/components/pages/protected/vendors/import/vendor-import-page'

export const metadata: Metadata = {
  title: 'Import Vendors',
}

const Page: React.FC = () => <VendorImportPage />

export default Page

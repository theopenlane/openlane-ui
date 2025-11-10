import React from 'react'
import { Metadata } from 'next'
import DocumentsPage from '@/components/pages/protected/trust-center/documents/documents-page'

export const metadata: Metadata = {
  title: 'Documents | Trust center',
}

const Page: React.FC = () => {
  return <DocumentsPage />
}

export default Page

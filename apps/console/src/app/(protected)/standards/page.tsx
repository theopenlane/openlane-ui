import React from 'react'
import StandardsPage from '@/components/pages/protected/standards/standards-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Standards Catalog',
}

const Page: React.FC = () => <StandardsPage />

export default Page

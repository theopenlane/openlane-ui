import React from 'react'
import type { Metadata } from 'next'
import DomainDiscoveryImportPage from '@/components/pages/protected/scans/domain-scan/domain-discovery-import-page'

export const metadata: Metadata = {
  title: 'Domain Discovery',
}

const Page: React.FC = () => <DomainDiscoveryImportPage />

export default Page

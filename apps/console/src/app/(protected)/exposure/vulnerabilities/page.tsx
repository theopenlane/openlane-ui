import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import VulnerabilityPage from '@/components/pages/protected/vulnerabilities/table/page'

export const metadata: Metadata = {
  title: 'Vulnerabilities',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Vulnerabilities" />
      <VulnerabilityPage />
    </>
  )
}

export default Page

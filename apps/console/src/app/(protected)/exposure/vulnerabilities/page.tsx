import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import VulnerabilityPage from '@/components/pages/protected/vulnerabilities/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Vulnerabilities" />
      <VulnerabilityPage />
    </>
  )
}

export default Page

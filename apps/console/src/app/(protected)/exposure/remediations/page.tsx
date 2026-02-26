import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import RemediationPage from '@/components/pages/protected/remediations/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Remediations" />
      <RemediationPage />
    </>
  )
}

export default Page

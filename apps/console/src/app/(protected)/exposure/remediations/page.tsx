import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import RemediationPage from '@/components/pages/protected/remediations/table/page'

export const metadata: Metadata = {
  title: 'Remediations',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Remediations" />
      <RemediationPage />
    </>
  )
}

export default Page

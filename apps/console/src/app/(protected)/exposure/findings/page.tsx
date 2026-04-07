import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import FindingPage from '@/components/pages/protected/findings/table/page'

export const metadata: Metadata = {
  title: 'Findings',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Findings" />
      <FindingPage />
    </>
  )
}

export default Page

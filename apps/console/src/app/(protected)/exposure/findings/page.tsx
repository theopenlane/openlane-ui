import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import FindingPage from '@/components/pages/protected/findings/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Findings" />
      <FindingPage />
    </>
  )
}

export default Page

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ScanPage from '@/components/pages/protected/scans/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Scans" />
      <ScanPage />
    </>
  )
}

export default Page

import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import ScanPage from '@/components/pages/protected/scans/table/page'

export const metadata: Metadata = {
  title: 'Scans',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Scans" />
      <ScanPage />
    </>
  )
}

export default Page

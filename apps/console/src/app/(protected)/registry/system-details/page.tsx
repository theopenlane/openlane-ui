import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import SystemDetailPage from '@/components/pages/protected/system-details/table/page'

export const metadata: Metadata = {
  title: 'System Details',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="System Details" />
      <SystemDetailPage />
    </>
  )
}

export default Page

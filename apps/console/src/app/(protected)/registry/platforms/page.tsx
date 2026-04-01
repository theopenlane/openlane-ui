import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import PlatformPage from '@/components/pages/protected/platforms/table/page'

export const metadata: Metadata = {
  title: 'Platform Registry',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Platform Registry" />
      <PlatformPage />
    </>
  )
}

export default Page

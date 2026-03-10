import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import VendorsPage from '@/components/pages/protected/vendors/table/page'

export const metadata: Metadata = {
  title: 'Vendors',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Vendors" />
      <VendorsPage />
    </>
  )
}

export default Page

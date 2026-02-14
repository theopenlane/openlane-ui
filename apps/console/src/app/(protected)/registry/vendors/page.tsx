import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import VendorsPage from '@/components/pages/protected/vendors/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Vendors" />
      <VendorsPage />
    </>
  )
}

export default Page

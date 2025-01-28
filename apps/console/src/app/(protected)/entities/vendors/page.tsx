import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { VendorsTable } from '@/components/pages/protected/entities/vendors-table'

const Page: React.FC = () => {
  return (
    <div>
      <PageHeading heading="Vendors" eyebrow="Entities" />
      <VendorsTable />
    </div>
  )
}

export default Page

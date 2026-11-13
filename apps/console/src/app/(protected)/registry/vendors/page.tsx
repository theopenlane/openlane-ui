import React from 'react'
import { type Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import VendorsPage from '@/components/pages/protected/vendors/table/page'
import { VendorScoringMenu } from '@/components/pages/protected/vendors/scoring/vendor-scoring-menu'

export const metadata: Metadata = {
  title: 'Vendors',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Vendors" actions={<VendorScoringMenu />} />
      <VendorsPage />
    </>
  )
}

export default Page

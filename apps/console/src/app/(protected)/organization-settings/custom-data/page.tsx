import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { Metadata } from 'next'
import CustomDataPage from '@/components/pages/protected/organization-settings/custom-data/custom-data-page'

export const metadata: Metadata = {
  title: 'Custom Data',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Custom Data" />
      <CustomDataPage />
    </>
  )
}

export default Page

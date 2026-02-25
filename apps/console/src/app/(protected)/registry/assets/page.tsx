import React from 'react'
import { Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import AssetPage from '@/components/pages/protected/assets/table/page'

export const metadata: Metadata = {
  title: 'Assets',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Assets" />
      <AssetPage />
    </>
  )
}

export default Page

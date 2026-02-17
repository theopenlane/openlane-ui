import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AssetPage from '@/components/pages/protected/assets/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Assets" />
      <AssetPage />
    </>
  )
}

export default Page

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import AssetPage from '@/components/pages/protected/assets/table/page'
import AssetDetailsSheet from '@/components/pages/protected/assets/create/sidebar/details-sheet'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Assets" />
      <AssetPage />
      <AssetDetailsSheet />
    </>
  )
}

export default Page

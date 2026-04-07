import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CampaignsPage from '@/components/pages/protected/campaigns/table/campaigns-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Campaigns',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Campaigns" />
      <CampaignsPage />
    </>
  )
}

export default Page

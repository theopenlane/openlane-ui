import React from 'react'
import CampaignsPage from '@/components/pages/protected/campaigns/table/campaigns-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Campaigns',
}

const Page: React.FC = () => {
  return <CampaignsPage />
}

export default Page

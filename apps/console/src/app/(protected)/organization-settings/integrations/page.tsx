import IntegrationsPage from '@/components/pages/protected/organization-settings/integrations/integrations-page'
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Integrations',
}

const Page = () => {
  return <IntegrationsPage />
}

export default Page

'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
// import { useDebounce } from '@uidotdev/usehooks'
import { useGetIntegrations } from '@/lib/graphql-hooks/integrations'
import { IntegrationsGrid } from './integrations-grid'
import { IntegrationTab } from './config'

const IntegrationsPage = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('Installed')

  const { data } = useGetIntegrations({
    where: {},
  })

  return (
    <div>
      <PageHeading heading="Integrations" />
      <IntegrationsToolbar activeTab={activeTab} setActiveTab={setActiveTab} installedCount={data?.integrations.edges?.length} />
      <IntegrationsGrid integrations={data?.integrations} activeTab={activeTab} />
    </div>
  )
}

export default IntegrationsPage

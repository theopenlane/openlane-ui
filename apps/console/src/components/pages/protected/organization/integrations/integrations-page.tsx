'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
import { useDebounce } from '@uidotdev/usehooks'
import { useGetIntegrations } from '@/lib/graphql-hooks/integrations'
import { IntegrationsGrid } from './integrations-grid'
import { IntegrationTab } from './config'

const IntegrationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<IntegrationTab>('Installed')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data, isFetching } = useGetIntegrations({
    where: {
      nameContainsFold: debouncedSearch,
    },
  })

  return (
    <div>
      <PageHeading heading="Integrations" />
      <IntegrationsToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searching={isFetching}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        installedCount={data?.integrations.edges?.length}
      />
      <IntegrationsGrid integrations={data?.integrations} activeTab={activeTab} />
    </div>
  )
}

export default IntegrationsPage

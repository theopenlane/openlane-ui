'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
import { useDebounce } from '@uidotdev/usehooks'
import { useGetIntegrations } from '@/lib/graphql-hooks/integrations'
import { IntegrationsGrid } from './integrations-grid'

const IntegrationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data, isFetching } = useGetIntegrations({
    where: {
      nameContainsFold: debouncedSearch,
    },
  })
  console.log(data)
  const nodes = [
    { id: 'asd', name: 'Slack', tags: ['tag1', 'tag2'], description: 'desc' },
    { id: 'asd2', name: 'Slack', tags: ['tag1', 'tag2'], description: 'desc' },
    { id: 'asd1', name: 'Slack', tags: ['tag1', 'tag2'], description: 'desc' },
    { id: 'asd4', name: 'Slack', tags: ['tag1', 'tag2'], description: 'desc' },
  ]
  return (
    <div>
      <PageHeading heading="Integrations" />
      <IntegrationsToolbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} searching={isFetching} />
      <IntegrationsGrid items={nodes} />
    </div>
  )
}

export default IntegrationsPage

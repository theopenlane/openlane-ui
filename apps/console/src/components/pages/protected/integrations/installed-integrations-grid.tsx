import React, { useMemo } from 'react'

import { type IntegrationHealthFilter, type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'
import { getInstalledIntegrationConfig, matchesIntegrationSearch } from '@/lib/integrations/utils'
import { buildIntegrationHealthOptions } from '@/lib/integrations/health'
import InstalledIntegrationCard from './installed-integration-card'
import InstalledIntegrationsFilters from './installed-integrations-filters'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'

type InstalledIntegrationsGridProps = {
  installedIntegrations: IntegrationNode[]
  healthFilter: IntegrationHealthFilter
  setHealthFilter: (health: IntegrationHealthFilter) => void
  providers: IntegrationProvider[]
  searchQuery: string
  canManage: boolean
}

export const InstalledIntegrationsGrid = ({ installedIntegrations, healthFilter, setHealthFilter, providers, searchQuery, canManage }: InstalledIntegrationsGridProps) => {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const searchMatches = useMemo(
    () =>
      installedIntegrations.filter((integration) => {
        if (normalizedQuery === '') {
          return true
        }

        const provider = getInstalledIntegrationConfig(integration, providers)?.provider
        const tags = provider?.tags?.length ? provider.tags : (integration.tags ?? [])

        return matchesIntegrationSearch(
          [integration.name, integration.kind, provider?.id, provider?.slug, provider?.displayName, provider?.family, provider?.description || integration.description, ...tags],
          normalizedQuery,
        )
      }),
    [installedIntegrations, providers, normalizedQuery],
  )

  const healthOptions = useMemo(() => buildIntegrationHealthOptions(searchMatches, healthFilter), [searchMatches, healthFilter])

  const filteredInstalledIntegrations = useMemo(
    () => (healthFilter === 'All' ? searchMatches : searchMatches.filter((integration) => integration.status === healthFilter)),
    [searchMatches, healthFilter],
  )

  return (
    <div className="flex flex-col gap-5">
      <InstalledIntegrationsFilters healthFilter={healthFilter} setHealthFilter={setHealthFilter} healthOptions={healthOptions} />
      {filteredInstalledIntegrations.length === 0 ? (
        installedIntegrations.length === 0 ? (
          <EmptyTabState title="No integrations installed" description="Connect an integration from the Browse Integrations tab and it will appear here." />
        ) : (
          <EmptyTabState title="No installed integrations match your filters" description="Try a different search term or select a different health filter." />
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredInstalledIntegrations.map((integration) => (
            <InstalledIntegrationCard key={integration.id} integration={integration} providers={providers} canManage={canManage} linkToDetail />
          ))}
        </div>
      )}
    </div>
  )
}

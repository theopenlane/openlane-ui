'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'

import { type AvailableIntegrationNode, getInstalledIntegrationConfig, type IntegrationNode, type IntegrationProvider, type IntegrationTab } from './config'
import AvailableIntegrationCard from './available-integration-card'
import InstalledIntegrationCard from './installed-integration-card'
import { INFO_EMAIL } from '@/constants'

type IntegrationsGridProps = {
  installedIntegrations: IntegrationNode[]
  availableIntegrations: AvailableIntegrationNode[]
  activeTab: IntegrationTab
  providers: IntegrationProvider[]
  searchQuery: string
}

const EmptyState = ({ message }: { message: string }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
    <div className="text-center py-16 border rounded-lg max-w-screen-sm">
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
)

export function IntegrationsGrid({ installedIntegrations, availableIntegrations, activeTab, providers, searchQuery }: IntegrationsGridProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredAvailableIntegrations = availableIntegrations.filter((integration) => {
    if (activeTab === 'All' && !integration.provider.active) {
      return false
    }

    if (activeTab === 'Coming Soon' && integration.provider.active) {
      return false
    }

    if (activeTab === 'Installed') {
      return false
    }

    if (normalizedQuery === '') {
      return true
    }

    return matchesAvailableSearch(integration, normalizedQuery)
  })

  const filteredInstalledIntegrations = installedIntegrations.filter((integration) => {
    if (activeTab !== 'Installed') {
      return false
    }

    if (normalizedQuery === '') {
      return true
    }

    const integrationConfig = getInstalledIntegrationConfig(integration, providers)
    return matchesInstalledSearch(integration, integrationConfig?.provider, normalizedQuery)
  })

  if (activeTab === 'Installed' && filteredInstalledIntegrations.length === 0) {
    return <EmptyState message={normalizedQuery ? 'No installed integrations match your search.' : 'No integrations installed.'} />
  }

  if (activeTab !== 'Installed' && filteredAvailableIntegrations.length === 0 && normalizedQuery) {
    return <EmptyState message="No integrations match your search." />
  }

  if (activeTab === 'Coming Soon' && filteredAvailableIntegrations.length === 0) {
    return <EmptyState message="No coming soon integrations." />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
      {activeTab !== 'Installed' && filteredAvailableIntegrations.map((integration) => <AvailableIntegrationCard key={integration.id} integration={integration} />)}
      {activeTab === 'Installed' && filteredInstalledIntegrations.map((integration) => <InstalledIntegrationCard key={integration.id} integration={integration} providers={providers} />)}
      {activeTab === 'All' && (
        <Card className="flex min-h-[300px] items-center justify-center p-8">
          <div className="flex max-w-[280px] flex-col items-center justify-center gap-6 text-center">
            <h2 className="text-center">
              Missing an Integration? <br />
              Reach out and we can get you setup.
            </h2>
            <a href={INFO_EMAIL}>
              <Button variant="secondary" className="text-brand">
                Request
              </Button>
            </a>
          </div>
        </Card>
      )}
    </div>
  )
}

function matchesAvailableSearch(integration: AvailableIntegrationNode, query: string): boolean {
  const haystack = [integration.name, integration.description, integration.provider.name, integration.provider.displayName, ...(integration.tags ?? [])].join(' ').toLowerCase()
  return haystack.includes(query)
}

function matchesInstalledSearch(integration: IntegrationNode, provider: IntegrationProvider | undefined, query: string): boolean {
  const tags = provider?.tags?.length ? provider.tags : (integration.tags ?? [])
  const description = provider?.description || integration.description || ''
  const haystack = [integration.name, provider?.name ?? '', provider?.displayName ?? '', description, ...tags].join(' ').toLowerCase()
  return haystack.includes(query)
}

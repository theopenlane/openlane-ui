'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'

import { type AvailableIntegrationNode, type IntegrationNode, type IntegrationProvider, type IntegrationTab } from '@/lib/integrations/types'
import { getInstalledIntegrationConfig } from '@/lib/integrations/utils'
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

    return matchesSearch(
      [
        integration.name,
        integration.description,
        integration.provider.id,
        integration.provider.slug,
        integration.provider.family,
        integration.provider.displayName,
        integration.provider.category,
        ...(integration.tags ?? []),
      ],
      normalizedQuery,
    )
  })

  const filteredInstalledIntegrations = installedIntegrations.filter((integration) => {
    if (activeTab !== 'Installed') {
      return false
    }

    if (normalizedQuery === '') {
      return true
    }

    const integrationConfig = getInstalledIntegrationConfig(integration, providers)
    const provider = integrationConfig?.provider
    const tags = provider?.tags?.length ? provider.tags : (integration.tags ?? [])
    return matchesSearch(
      [integration.name, integration.kind, provider?.id, provider?.slug, provider?.displayName, provider?.family, provider?.description || integration.description, ...tags],
      normalizedQuery,
    )
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

  if (activeTab === 'Installed') {
    return (
      <div className="grid gap-4 lg:grid-cols-2 mt-5">
        {filteredInstalledIntegrations.map((integration) => (
          <InstalledIntegrationCard key={integration.id} integration={integration} providers={providers} />
        ))}
      </div>
    )
  }

  return (
    <div className="mt-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAvailableIntegrations.map((integration) => (
          <AvailableIntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
      {activeTab === 'All' && (
        <>
          <Separator className="my-6" />
          <Card className="flex items-center justify-between p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary">
            <div>
              <h3 className="text-sm font-medium">Missing an Integration?</h3>
              <p className="text-sm text-muted-foreground">Reach out and we can get you setup.</p>
            </div>
            <a href={INFO_EMAIL}>
              <Button variant="secondary" className="text-brand">
                Request
              </Button>
            </a>
          </Card>
        </>
      )}
    </div>
  )
}

function matchesSearch(fields: Array<string | null | undefined>, query: string): boolean {
  return fields.filter(Boolean).join(' ').toLowerCase().includes(query)
}

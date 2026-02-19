'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'

import { GetIntegrationsQuery } from '@repo/codegen/src/schema'
import { IntegrationProvider, IntegrationTab, toAvailableIntegration } from './config'
import AvailableIntegrationCard from './available-integration-card'
import InstalledIntegrationCard from './installed-integration-card'
import { INFO_EMAIL } from '@/constants'

type IntegrationsGridProps = {
  integrations?: GetIntegrationsQuery['integrations']
  activeTab: IntegrationTab
  providers: IntegrationProvider[]
}

export function IntegrationsGrid({ integrations, activeTab, providers }: IntegrationsGridProps) {
  const installedNames = integrations?.edges?.map((edge) => edge?.node?.name?.toLowerCase()).filter((n): n is string => !!n) ?? []

  const availableIntegrations = providers
    .filter((p) => p.active)
    .map(toAvailableIntegration)
    .filter((ai) => !installedNames.some((installed) => installed.includes(ai.name.toLowerCase())))

  if (!integrations?.edges?.length && activeTab === 'Installed') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
        <div className="text-center py-16 border rounded-lg max-w-screen-sm">
          <p className="text-muted-foreground">No integrations installed.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
      {activeTab === 'Available' && availableIntegrations.map((integration) => <AvailableIntegrationCard key={integration.id} integration={integration} />)}
      {activeTab === 'Installed' &&
        integrations?.edges?.map((edge) => {
          if (edge?.node) return <InstalledIntegrationCard key={edge?.node?.id} integration={edge?.node} providers={providers} />
        })}
      {activeTab === 'Available' && (
        <Card className="flex justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-4">
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

'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'

import { GetIntegrationsQuery } from '@repo/codegen/src/schema'
import { AVAILABLE_INTEGRATIONS, IntegrationTab } from './config'
import AvailableIntegrationCard from './available-integration-card'
import InstalledIntegrationCard from './installed-integration-card'

type IntegrationsGridProps = {
  integrations?: GetIntegrationsQuery['integrations']
  activeTab: IntegrationTab
}

export function IntegrationsGrid({ integrations, activeTab }: IntegrationsGridProps) {
  if (!integrations?.edges?.length) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <p className="text-muted-foreground">No integrations found.</p>
      </div>
    )
  }

  const installedNames = integrations?.edges?.map((edge) => edge?.node?.name?.toLowerCase()).filter((n): n is string => !!n) ?? []
  const filteredAvailable = AVAILABLE_INTEGRATIONS.filter((ai) => !installedNames.some((installed) => installed.includes(ai.name.toLowerCase())))

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-5">
      {activeTab === 'Available' && filteredAvailable.map((integration) => <AvailableIntegrationCard key={integration.id} integration={integration} />)}
      {activeTab === 'Installed' &&
        integrations.edges.map((edge) => {
          if (edge?.node) return <InstalledIntegrationCard key={edge?.node?.id} integration={edge?.node} />
        })}
      {activeTab === 'Available' && (
        <Card className="flex justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-4">
            <h2>MIssing an Integration?</h2>
            <Button variant="outline" className="text-brand">
              Request
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

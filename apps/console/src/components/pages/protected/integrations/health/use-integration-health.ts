'use client'

import { useMemo } from 'react'
import { useOperationRunStrips, type TOperationRunsKey } from '@/lib/graphql-hooks/integration-run'
import { integrationHealthBadge, type TIntegrationHealthBadge } from '@/lib/integrations/health'
import { type IntegrationHealth, type IntegrationMetadata, type IntegrationNode } from '@/lib/integrations/types'
import { monitoredOperationKeys, attentionOperations, buildOperationHealth, type TOperationHealth } from '@/lib/integrations/run-health'
import { integrationInstanceLabel, useProviderInstallations } from '../use-provider-installations'

export type TInstanceHealth = {
  integration: IntegrationNode
  label: string
  secondaryId: string
  health?: IntegrationHealth
  badge: TIntegrationHealthBadge
  operations: TOperationHealth[]
  attentionOperations: TOperationHealth[]
}

export const useIntegrationHealth = (definitionId: string) => {
  const { provider, installations, canEdit, isLoading, isError } = useProviderInstallations(definitionId)

  const operationKeys = useMemo<TOperationRunsKey[]>(() => installations.flatMap((integration) => monitoredOperationKeys(provider, integration)), [provider, installations])

  const { runsByKey, isPending: stripsPending, error: runsError } = useOperationRunStrips(operationKeys)

  const instances = useMemo<TInstanceHealth[]>(
    () =>
      installations.map((integration) => {
        const health: IntegrationHealth | undefined = integration.health ?? undefined
        const metadata: IntegrationMetadata | undefined = integration.metadata ?? undefined
        const operations = buildOperationHealth(provider, integration, runsByKey)
        const needingAttention = attentionOperations(operations)
        const label = integrationInstanceLabel(integration)
        const externalId = metadata?.externalId ?? ''

        return {
          integration,
          label,
          secondaryId: externalId === label ? '' : externalId,
          health,
          badge: integrationHealthBadge(integration.status, health, { failingOperations: needingAttention.map((operation) => operation.name) }),
          operations,
          attentionOperations: needingAttention,
        }
      }),
    [provider, installations, runsByKey],
  )

  const overall = useMemo(
    () => instances.reduce<TInstanceHealth | undefined>((worst, instance) => (!worst || instance.badge.severity > worst.badge.severity ? instance : worst), undefined),
    [instances],
  )

  return {
    provider,
    installations,
    instances,
    overall,
    canEdit,
    isLoading,
    isError,
    runsError,
    isLoadingRuns: operationKeys.length > 0 && stripsPending,
  }
}

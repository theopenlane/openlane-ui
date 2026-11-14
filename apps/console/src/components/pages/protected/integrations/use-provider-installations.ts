'use client'

import { useMemo } from 'react'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { useIntegrationPermissions } from '@/lib/authz/use-integration-permissions'
import { filterFinalizedIntegrationsForProvider } from '@/lib/integrations/utils'
import { type IntegrationMetadata, type IntegrationNode } from '@/lib/integrations/types'

export const integrationInstanceLabel = (integration: Pick<IntegrationNode, 'name' | 'metadata'>): string => {
  const metadata: IntegrationMetadata | undefined = integration.metadata ?? undefined

  return metadata?.externalName || metadata?.externalId || integration.name
}

export const useProviderInstallations = (definitionId: string) => {
  const { data, isPending: integrationsPending, isError: integrationsError } = useGetIntegrations({ where: {} })
  const { data: providersData, isPending: providersPending, isError: providersError } = useIntegrationProviders()
  const { canEdit, canRunOperations, isLoading: permissionsLoading } = useIntegrationPermissions()

  const providers = useMemo(() => providersData?.providers ?? [], [providersData?.providers])
  const provider = useMemo(() => providers.find((candidate) => candidate.id === definitionId), [providers, definitionId])
  const installations = useMemo(() => (provider ? filterFinalizedIntegrationsForProvider(getNodes(data?.integrations), provider, providers) : []), [data?.integrations, provider, providers])

  return {
    providers,
    provider,
    installations,
    canEdit,
    canRunOperations,
    isLoading: integrationsPending || providersPending || permissionsLoading,
    isError: integrationsError || providersError,
  }
}

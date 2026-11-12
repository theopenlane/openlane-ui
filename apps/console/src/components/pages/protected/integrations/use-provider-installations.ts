'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { filterFinalizedIntegrationsForProvider } from '@/lib/integrations/utils'
import { type IntegrationMetadata, type IntegrationNode } from '@/lib/integrations/types'

export const integrationInstanceLabel = (integration: Pick<IntegrationNode, 'name' | 'metadata'>): string => {
  const metadata: IntegrationMetadata | undefined = integration.metadata ?? undefined

  return metadata?.externalName || metadata?.externalId || integration.name
}

export const useProviderInstallations = (definitionId: string) => {
  const { data, isPending: integrationsPending, isError: integrationsError } = useGetIntegrations({ where: {} })
  const { data: providersData, isPending: providersPending, isError: providersError } = useIntegrationProviders()
  const { data: orgPermission, isLoading: permissionsLoading } = useOrganizationRoles()
  const { data: session } = useSession()

  const providers = useMemo(() => providersData?.providers ?? [], [providersData?.providers])
  const provider = useMemo(() => providers.find((candidate) => candidate.id === definitionId), [providers, definitionId])
  const installations = useMemo(() => (provider ? filterFinalizedIntegrationsForProvider(getNodes(data?.integrations), provider, providers) : []), [data?.integrations, provider, providers])

  return {
    providers,
    provider,
    installations,
    canManage: canEdit(orgPermission?.roles, session),
    isLoading: integrationsPending || providersPending || permissionsLoading,
    isError: integrationsError || providersError,
  }
}

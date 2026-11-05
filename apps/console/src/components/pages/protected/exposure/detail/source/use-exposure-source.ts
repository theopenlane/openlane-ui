import { useMemo } from 'react'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { type IntegrationProviderMatchFields } from '@/lib/integrations/types'
import { matchIntegrationProvider, normalizeIntegrationToken } from '@/lib/integrations/utils'

export type TExposureSourceFields = {
  id: string
  source?: string | null
  externalID?: string | null
  externalOwnerID?: string | null
  externalURI?: string | null
}

export type TSourceIntegration = IntegrationProviderMatchFields

export const hasExposureSourceDetails = (fields: TExposureSourceFields) => [fields.source, fields.externalID, fields.externalOwnerID, fields.externalURI].some((value) => !!value?.trim())

export const useExposureSource = (fields: TExposureSourceFields, integrations: TSourceIntegration[]) => {
  const { data: providersData } = useIntegrationProviders()
  const source = fields.source?.trim() || null

  return useMemo(() => {
    const providers = providersData?.providers ?? []
    const sourceToken = source ? normalizeIntegrationToken(source) : null
    const namedLikeSource = sourceToken ? integrations.filter((integration) => normalizeIntegrationToken(integration.name) === sourceToken) : []
    const integration = integrations.length === 1 ? integrations[0] : namedLikeSource.length === 1 ? namedLikeSource[0] : undefined
    const provider = integration ? matchIntegrationProvider(integration, providers) : undefined
    const label = provider?.displayName ?? integration?.name ?? source
    const isAmbiguous = !integration && integrations.length > 1

    return {
      label,
      integrationNames: integrations.map((item) => item.name),
      openLabel: !isAmbiguous && label ? `Open in ${label}` : 'Open source',
    }
  }, [integrations, providersData, source])
}

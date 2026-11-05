import { useSourceIntegrationProvider } from '@/lib/query-hooks/integrations'

export type TExposureSourceFields = {
  id: string
  source?: string | null
  sourceDefinitionID?: string | null
  externalID?: string | null
  externalOwnerID?: string | null
  externalURI?: string | null
}

export const hasExposureSourceDetails = (fields: TExposureSourceFields) => [fields.source, fields.externalID, fields.externalOwnerID, fields.externalURI].some((value) => !!value?.trim())

export const useExposureSource = (fields: TExposureSourceFields) => {
  const provider = useSourceIntegrationProvider(fields.sourceDefinitionID)
  const label = provider?.displayName || fields.source?.trim() || null

  return { label, openLabel: label ? `Open in ${label}` : 'Open source' }
}

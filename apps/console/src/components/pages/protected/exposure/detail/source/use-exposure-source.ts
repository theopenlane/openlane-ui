import { useSourceIntegrationProvider } from '@/lib/query-hooks/integrations'

export type TExposureSourceFields = {
  id: string
  source?: string | null
  sourceDefinitionID?: string | null
  externalID?: string | null
  externalOwnerID?: string | null
  externalURI?: string | null
}

export type TSourceDetailRow = {
  label: string
  value?: string | null
  copyable?: boolean
}

export const getExposureSourceRows = (fields: TExposureSourceFields, extraRows: TSourceDetailRow[] = []): TSourceDetailRow[] => [
  { label: 'External ID', value: fields.externalID, copyable: true },
  { label: 'External Owner ID', value: fields.externalOwnerID, copyable: true },
  ...extraRows,
  { label: 'External URI', value: fields.externalURI, copyable: true },
]

export const hasExposureSourceDetails = (fields: TExposureSourceFields, extraRows: TSourceDetailRow[] = []) =>
  !!fields.source?.trim() || getExposureSourceRows(fields, extraRows).some((row) => !!row.value?.trim())

export const useExposureSource = (fields: TExposureSourceFields) => {
  const provider = useSourceIntegrationProvider(fields.sourceDefinitionID)
  const label = provider?.displayName || fields.source?.trim() || null

  return { label, openLabel: label ? `Open in ${label}` : 'Open source' }
}

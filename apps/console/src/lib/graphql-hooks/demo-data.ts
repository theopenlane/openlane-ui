import { useCallback, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { withPartialData } from '@/lib/graphql-partial-data'
import { DELETE_DEMO_DATA, GET_DEMO_DATA_TYPE_COUNTS, SEED_DEMO_DATA } from '@repo/codegen/query/demo-data'
import {
  type DeleteDemoDataMutation,
  type DeleteDemoDataMutationVariables,
  type GetDemoDataAutomationPreviewQuery,
  type GetDemoDataCompliancePreviewQuery,
  type GetDemoDataExposurePreviewQuery,
  type GetDemoDataOrganizationSettingsPreviewQuery,
  type GetDemoDataRegistryPreviewQuery,
  type GetDemoDataTypeCountsQuery,
  type GetDemoDataTypeCountsQueryVariables,
  type SeedDemoDataMutation,
  type SeedDemoDataMutationVariables,
} from '@repo/codegen/src/schema'
import { type Notification } from '@/lib/graphql-hooks/notifications'
import { type Connection, getNodes } from '@/lib/graphql-hooks/connection'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { DEMO_DATA_TYPES, type TDemoDataType, type TDemoDataTypeFlag, type TDemoDataTypeKey } from '@/constants/demo-data-types'
import { type TObjectNameSource } from '@/utils/object-display-name'
import { isRecord } from '@/utils/type-guards'

export const DEMO_DATASET = 'soc2'
export const DEMO_DATA_SECTION_ID = 'demo-data'
const DEMO_DATA_SETTINGS_URL = `/organization-settings/general-settings#${DEMO_DATA_SECTION_ID}`

const IMPORT_FAILED_TITLE_SUFFIX = ' import failed'

export type TDemoDataSeedOutcome = 'completed' | 'failed'

export const getDemoDataSeedOutcome = (notification: Notification): TDemoDataSeedOutcome | null => {
  if (notification.objectType !== 'import.completed' || !isRecord(notification.data) || notification.data.url !== DEMO_DATA_SETTINGS_URL) return null
  const { persisted, failed } = notification.data
  const isImportFailure = !!notification.title?.endsWith(IMPORT_FAILED_TITLE_SUFFIX)
  return !isImportFailure && typeof persisted === 'number' && persisted > 0 && failed === 0 ? 'completed' : 'failed'
}

const DEMO_DATA_SOURCE_KEY = `demo/${DEMO_DATASET}`
const DEMO_DATA_PRESENCE_KEY = ['demoDataPresence', DEMO_DATASET]

export type TDemoDataTypeCounts = Partial<Record<TDemoDataTypeKey, number>>

export type TDemoDataPresence = {
  counts: TDemoDataTypeCounts
  hasAny: boolean
  hasAll: boolean
}

const SEED_MARKER_KEYS: ReadonlySet<TDemoDataTypeKey> = new Set(['programs', 'controls', 'internalPolicies', 'procedures', 'risks', 'entities', 'assets', 'evidences', 'tasks'])

const toPresence = (data: GetDemoDataTypeCountsQuery, availableTypes: TDemoDataType[]): TDemoDataPresence => {
  const counts: TDemoDataTypeCounts = Object.fromEntries(availableTypes.map(({ key }) => [key, data[key]?.totalCount ?? 0]))
  const markers = availableTypes.filter(({ key }) => SEED_MARKER_KEYS.has(key))
  return {
    counts,
    hasAny: availableTypes.some(({ key }) => (counts[key] ?? 0) > 0),
    hasAll: markers.length > 0 && markers.every(({ key }) => (counts[key] ?? 0) > 0),
  }
}

const toTypeFlags = (types: TDemoDataType[]): Partial<Record<TDemoDataTypeFlag, boolean>> => {
  const flags: Partial<Record<TDemoDataTypeFlag, boolean>> = {}
  types.forEach((type) => {
    flags[type.flag] = true
  })
  return flags
}

export const useDemoDataPresence = ({ enabled, refetchInterval }: { enabled: boolean; refetchInterval: number | false }) => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()
  const organizationId = session?.user?.activeOrganizationId
  const { hasObjectType, isLoading: isModuleAccessLoading } = useModuleAccess()
  const availableTypes = useMemo(() => DEMO_DATA_TYPES.filter((type) => hasObjectType(type.objectType)), [hasObjectType])
  const flags = toTypeFlags(availableTypes)

  return useQuery<GetDemoDataTypeCountsQuery, unknown, TDemoDataPresence>({
    queryKey: [...DEMO_DATA_PRESENCE_KEY, organizationId, flags],
    queryFn: () => withPartialData(client.request<GetDemoDataTypeCountsQuery, GetDemoDataTypeCountsQueryVariables>(GET_DEMO_DATA_TYPE_COUNTS, { sourceKey: DEMO_DATA_SOURCE_KEY, ...flags })),
    select: useCallback((data: GetDemoDataTypeCountsQuery) => toPresence(data, availableTypes), [availableTypes]),
    enabled: enabled && !!organizationId && !isModuleAccessLoading && availableTypes.length > 0,
    refetchInterval,
    staleTime: 0,
    placeholderData: undefined,
  })
}

export const DEMO_DATA_PREVIEW_SIZE = 10

export type TDemoDataPreviewNode = TObjectNameSource & { id: string; detail?: string | null; field?: string }

type TDemoDataPreviewQuery = Partial<
  GetDemoDataCompliancePreviewQuery & GetDemoDataRegistryPreviewQuery & GetDemoDataExposurePreviewQuery & GetDemoDataAutomationPreviewQuery & GetDemoDataOrganizationSettingsPreviewQuery
>

export const useDemoDataTypePreview = (type: TDemoDataType, previewDocument: string) => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()
  const organizationId = session?.user?.activeOrganizationId
  const { key } = type

  return useQuery<TDemoDataPreviewQuery, unknown, TDemoDataPreviewNode[]>({
    queryKey: ['demoDataTypePreview', DEMO_DATASET, organizationId, key],
    queryFn: () => client.request<TDemoDataPreviewQuery>(previewDocument, { sourceKey: DEMO_DATA_SOURCE_KEY, first: DEMO_DATA_PREVIEW_SIZE, ...toTypeFlags([type]) }),
    select: useCallback(
      (data: TDemoDataPreviewQuery) => {
        const connection: Connection<TDemoDataPreviewNode> | undefined = data[key]
        return getNodes(connection)
      },
      [key],
    ),
    enabled: !!organizationId,
    placeholderData: undefined,
  })
}

export const useSeedDemoData = () => {
  const { client } = useGraphQLClient()

  return useMutation<SeedDemoDataMutation, unknown, SeedDemoDataMutationVariables>({
    mutationFn: (variables) => client.request(SEED_DEMO_DATA, variables),
  })
}

export const useDeleteDemoData = () => {
  const { client } = useGraphQLClient()

  return useMutation<DeleteDemoDataMutation, unknown, DeleteDemoDataMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_DEMO_DATA, variables),
  })
}

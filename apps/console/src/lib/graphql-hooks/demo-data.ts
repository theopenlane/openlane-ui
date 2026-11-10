import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { withPartialData } from '@/lib/graphql-partial-data'
import { DELETE_DEMO_DATA, GET_DEMO_DATA_PRESENCE, SEED_DEMO_DATA } from '@repo/codegen/query/demo-data'
import {
  type DeleteDemoDataMutation,
  type DeleteDemoDataMutationVariables,
  type GetDemoDataPresenceQuery,
  type GetDemoDataPresenceQueryVariables,
  type SeedDemoDataMutation,
  type SeedDemoDataMutationVariables,
} from '@repo/codegen/src/schema'
import { type Notification } from '@/lib/graphql-hooks/notifications'
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

const DEMO_DATA_PRESENCE_KEY = ['demoDataPresence', DEMO_DATASET]

export type TDemoDataPresence = {
  hasAny: boolean
  hasAll: boolean
}

const toPresence = (data: GetDemoDataPresenceQuery): TDemoDataPresence => {
  const counts = [data.programs, data.controls, data.internalPolicies, data.procedures, data.risks, data.entities, data.assets, data.evidences, data.tasks].map((connection) => connection.totalCount)
  return { hasAny: counts.some((count) => count > 0), hasAll: counts.every((count) => count > 0) }
}

export const useDemoDataPresence = ({ enabled, refetchInterval }: { enabled: boolean; refetchInterval: number | false }) => {
  const { client } = useGraphQLClient()
  const { data: session } = useSession()
  const organizationId = session?.user?.activeOrganizationId

  return useQuery<GetDemoDataPresenceQuery, unknown, TDemoDataPresence>({
    queryKey: [...DEMO_DATA_PRESENCE_KEY, organizationId],
    queryFn: () => withPartialData(client.request<GetDemoDataPresenceQuery, GetDemoDataPresenceQueryVariables>(GET_DEMO_DATA_PRESENCE, { sourceKey: `demo/${DEMO_DATASET}` })),
    select: toPresence,
    enabled: enabled && !!organizationId,
    refetchInterval,
    staleTime: 0,
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

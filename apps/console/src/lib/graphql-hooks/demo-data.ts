import { useMutation, useQuery } from '@tanstack/react-query'
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

export const DEMO_DATASET = 'soc2'

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

  return useQuery<GetDemoDataPresenceQuery, unknown, TDemoDataPresence>({
    queryKey: DEMO_DATA_PRESENCE_KEY,
    queryFn: () => withPartialData(client.request<GetDemoDataPresenceQuery, GetDemoDataPresenceQueryVariables>(GET_DEMO_DATA_PRESENCE, { sourceKey: `demo/${DEMO_DATASET}` })),
    select: toPresence,
    enabled,
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

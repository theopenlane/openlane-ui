import { useQuery } from '@tanstack/react-query'
import { GET_CONTROL_SELECT_OPTIONS } from '@repo/codegen/query/control'
import { GET_API_TOKENS_BY_IDS } from '@repo/codegen/query/tokens'
import type { GetApiTokensByIdsQuery, GetApiTokensByIdsQueryVariables, GetControlSelectOptionsQuery, GetControlSelectOptionsQueryVariables } from '@repo/codegen/src/schema'
import { graphqlRequest } from '../../lib/api'
import type { TConnection } from '../../lib/connection'
import type { TEvidenceDraft } from './use-evidence-draft-form-schema'

export const CONTROL_SEARCH_LIMIT = 10

export const EVIDENCE_FLOW_MUTATION_KEY = ['evidence-flow']

export type TControlOption = TEvidenceDraft['controls'][number]

export const useConnectionCheck = (connection: TConnection) =>
  useQuery({
    queryKey: ['connection-check', connection.tokenId],
    queryFn: () => graphqlRequest<GetApiTokensByIdsQuery, GetApiTokensByIdsQueryVariables>(connection, GET_API_TOKENS_BY_IDS, { where: { idIn: [connection.tokenId] } }),
    staleTime: 60 * 1000, // 1min
  })

export const useControlSearch = (connection: TConnection, term: string, enabled: boolean) =>
  useQuery({
    queryKey: ['controls', connection.organizationId, term],
    queryFn: async (): Promise<TControlOption[]> => {
      const data = await graphqlRequest<GetControlSelectOptionsQuery, GetControlSelectOptionsQueryVariables>(connection, GET_CONTROL_SELECT_OPTIONS, {
        where: { refCodeContainsFold: term, systemOwned: false, isTrustCenterControl: false },
        first: CONTROL_SEARCH_LIMIT,
      })
      return (data.controls.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
    },
    enabled,
  })

import { useQuery } from '@tanstack/react-query'
import { GET_CONTROL_SELECT_OPTIONS } from '@repo/codegen/query/control'
import { GET_EVIDENCE_CAPTURE_COLLECTOR } from '@repo/codegen/query/evidence-capture'
import type { GetControlSelectOptionsQuery, GetControlSelectOptionsQueryVariables, GetEvidenceCaptureCollectorQuery, GetEvidenceCaptureCollectorQueryVariables } from '@repo/codegen/src/schema'
import { graphqlRequest } from '../../lib/api'
import type { TConnection } from '../../lib/connection'
import type { TEvidenceDraft } from './use-evidence-draft-form-schema'

export const CONTROL_SEARCH_LIMIT = 10

export const EVIDENCE_FLOW_MUTATION_KEY = ['evidence-flow']

export type TControlOption = TEvidenceDraft['controls'][number]

export const useCollector = (connection: TConnection) =>
  useQuery({
    queryKey: ['collector', connection.tokenId],
    queryFn: async () => (await graphqlRequest<GetEvidenceCaptureCollectorQuery, GetEvidenceCaptureCollectorQueryVariables>(connection, GET_EVIDENCE_CAPTURE_COLLECTOR)).data.self,
    staleTime: 5 * 60 * 1000, // 5min
  })

export const useControlSearch = (connection: TConnection, term: string, enabled: boolean) =>
  useQuery({
    queryKey: ['controls', connection.organizationId, term],
    queryFn: async (): Promise<TControlOption[]> => {
      const { data } = await graphqlRequest<GetControlSelectOptionsQuery, GetControlSelectOptionsQueryVariables>(connection, GET_CONTROL_SELECT_OPTIONS, {
        where: { refCodeContainsFold: term, systemOwned: false, isTrustCenterControl: false },
        first: CONTROL_SEARCH_LIMIT,
      })
      return (data.controls.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))
    },
    enabled,
  })

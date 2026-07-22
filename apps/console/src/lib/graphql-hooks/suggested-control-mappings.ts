import { type GraphQLClient } from 'graphql-request'
import { GET_PROGRAM_CONTROLS_BY_REFCODE } from '@repo/codegen/query/control'
import {
  type GetProgramControlsByRefCodeQuery,
  type GetProgramControlsByRefCodeQueryVariables,
  type CreateMappedControlMutation,
  type CreateMappedControlMutationVariables,
  MappedControlMappingSource,
} from '@repo/codegen/src/schema'
import { type SuggestedControlMappingGroup } from '@/components/pages/protected/programs/create/shared/suggested-controls-schema'

const PROGRAM_CONTROLS_PAGE_SIZE = 100

type RecreateSeededControlMappingsArgs = {
  client: GraphQLClient
  programID: string
  mappingGroups?: SuggestedControlMappingGroup[]
  createMappedControl: (variables: CreateMappedControlMutationVariables) => Promise<CreateMappedControlMutation>
}

export type RecreateSeededControlMappingsResult = {
  createdCount: number
  failedCount: number
  unresolvedRefCodes: string[]
}

const fetchProgramControlIDsByRefCode = async (client: GraphQLClient, programID: string, refCodes: string[]): Promise<Map<string, string>> => {
  const idByRefCode = new Map<string, string>()
  let after: GetProgramControlsByRefCodeQueryVariables['after']

  do {
    const { controls } = await client.request<GetProgramControlsByRefCodeQuery, GetProgramControlsByRefCodeQueryVariables>(GET_PROGRAM_CONTROLS_BY_REFCODE, {
      refCodeIn: refCodes,
      programId: programID,
      first: PROGRAM_CONTROLS_PAGE_SIZE,
      after,
    })

    controls.edges?.forEach((edge) => {
      if (edge?.node?.refCode && edge.node.id) idByRefCode.set(edge.node.refCode, edge.node.id)
    })

    after = controls.pageInfo.hasNextPage ? controls.pageInfo.endCursor : undefined
  } while (after)

  return idByRefCode
}

export const recreateSeededControlMappings = async ({ client, programID, mappingGroups, createMappedControl }: RecreateSeededControlMappingsArgs): Promise<RecreateSeededControlMappingsResult> => {
  if (!mappingGroups?.length) return { createdCount: 0, failedCount: 0, unresolvedRefCodes: [] }

  const refCodes = [...new Set(mappingGroups.flatMap((group) => [...group.fromRefCodes, ...group.toRefCodes]))]
  const idByRefCode = await fetchProgramControlIDsByRefCode(client, programID, refCodes)
  const unresolvedRefCodes = refCodes.filter((refCode) => !idByRefCode.has(refCode))

  const results = await Promise.allSettled(
    mappingGroups.map((group): Promise<CreateMappedControlMutation | null> => {
      const fromControlIDs = group.fromRefCodes.map((refCode) => idByRefCode.get(refCode)).filter((id): id is string => !!id)
      const toControlIDs = group.toRefCodes.map((refCode) => idByRefCode.get(refCode)).filter((id): id is string => !!id)

      if (fromControlIDs.length === 0 || toControlIDs.length === 0) return Promise.resolve(null)

      return createMappedControl({
        input: {
          fromControlIDs,
          toControlIDs,
          mappingType: group.mappingType,
          confidence: group.confidence ?? undefined,
          relation: group.relation ?? undefined,
          source: MappedControlMappingSource.IMPORTED,
        },
      })
    }),
  )

  return {
    createdCount: results.filter((result) => result.status === 'fulfilled' && result.value !== null).length,
    failedCount: results.filter((result) => result.status === 'rejected').length,
    unresolvedRefCodes,
  }
}

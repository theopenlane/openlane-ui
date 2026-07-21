import { type GraphQLClient } from 'graphql-request'
import { GET_PROGRAM_CONTROLS_BY_REFCODE } from '@repo/codegen/query/control'
import {
  type GetProgramControlsByRefCodeQuery,
  type GetProgramControlsByRefCodeQueryVariables,
  type CreateMappedControlMutationVariables,
  MappedControlMappingSource,
  type MappedControlMappingType,
} from '@repo/codegen/src/schema'

export type SuggestedControlMappingGroup = {
  fromRefCodes: string[]
  toRefCodes: string[]
  mappingType: string
  confidence?: number | null
  relation?: string | null
}

type RecreateSeededControlMappingsArgs = {
  client: GraphQLClient
  programID: string
  mappingGroups?: SuggestedControlMappingGroup[]
  createMappedControl: (variables: CreateMappedControlMutationVariables) => Promise<unknown>
}

export async function recreateSeededControlMappings({ client, programID, mappingGroups, createMappedControl }: RecreateSeededControlMappingsArgs) {
  if (!mappingGroups?.length) return

  const refCodes = [...new Set(mappingGroups.flatMap((group) => [...group.fromRefCodes, ...group.toRefCodes]))]

  const { controls } = await client.request<GetProgramControlsByRefCodeQuery, GetProgramControlsByRefCodeQueryVariables>(GET_PROGRAM_CONTROLS_BY_REFCODE, {
    refCodeIn: refCodes,
    programId: programID,
  })

  const idByRefCode = new Map<string, string>()
  controls.edges?.forEach((edge) => {
    if (edge?.node?.refCode && edge.node.id) idByRefCode.set(edge.node.refCode, edge.node.id)
  })

  return Promise.allSettled(
    mappingGroups.map((group) => {
      const fromControlIDs = group.fromRefCodes.map((refCode) => idByRefCode.get(refCode)).filter((id): id is string => !!id)
      const toControlIDs = group.toRefCodes.map((refCode) => idByRefCode.get(refCode)).filter((id): id is string => !!id)

      if (fromControlIDs.length === 0 || toControlIDs.length === 0) return Promise.resolve()

      return createMappedControl({
        input: {
          fromControlIDs,
          toControlIDs,
          mappingType: group.mappingType as MappedControlMappingType,
          confidence: group.confidence ?? undefined,
          relation: group.relation ?? undefined,
          source: MappedControlMappingSource.IMPORTED,
        },
      })
    }),
  )
}

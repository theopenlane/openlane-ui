import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { type NarrativesWithFilterQuery, type NarrativesWithFilterQueryVariables } from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_NARRATIVES } from '@repo/codegen/query/narrative'

type GetAllNarrativesArgs = {
  where?: NarrativesWithFilterQueryVariables['where']
  orderBy?: NarrativesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type NarrativesNode = NonNullable<NonNullable<NonNullable<NarrativesWithFilterQuery['narratives']>['edges']>[number]>['node']

export type NarrativesNodeNonNull = NonNullable<NarrativesNode>

export const useNarrativesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllNarrativesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<NarrativesWithFilterQuery, unknown>({
    queryKey: ['narratives', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<NarrativesWithFilterQuery> => {
      const result = await client.request<NarrativesWithFilterQuery>(GET_ALL_NARRATIVES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.narratives?.edges ?? []

  const narrativesNodes: NarrativesNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as NarrativesNodeNonNull)

  return { ...queryResult, narrativesNodes }
}

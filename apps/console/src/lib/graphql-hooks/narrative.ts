import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { NarrativesWithFilterQuery, NarrativesWithFilterQueryVariables, Narrative } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_NARRATIVES } from '@repo/codegen/query/narrative'

type GetAllNarrativesArgs = {
  where?: NarrativesWithFilterQueryVariables['where']
  orderBy?: NarrativesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useNarrativesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllNarrativesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<NarrativesWithFilterQuery, unknown>({
    queryKey: ['narratives', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<NarrativesWithFilterQuery> => {
      const result = await client.request(GET_ALL_NARRATIVES, { where, orderBy, ...pagination?.query })
      return result as NarrativesWithFilterQuery
    },
    enabled,
  })
  const Narratives = (queryResult.data?.narratives?.edges?.map((edge) => ({ ...edge?.node })) ?? []) as Narrative[]
  return { ...queryResult, Narratives }
}

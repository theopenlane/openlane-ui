import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { SEARCH } from '@repo/codegen/query/search'
import { SearchQuery } from '@repo/codegen/src/schema'

export const useSearch = (query: string) => {
  const { client } = useGraphQLClient()

  return useQuery<SearchQuery, unknown>({
    queryKey: ['search', query],
    queryFn: async () => client.request(SEARCH, { query }),
    enabled: query.length > 2,
  })
}

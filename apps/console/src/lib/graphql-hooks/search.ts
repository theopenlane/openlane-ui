import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { SEARCH } from '@repo/codegen/query/search'
import { SearchQuery } from '@repo/codegen/src/schema'
import routeList from '@/route-list.json'
import { RoutePage } from '@/types'
import { useMemo } from 'react'

export const useSearch = (query: string) => {
  const { client } = useGraphQLClient()

  const queryData = useQuery<SearchQuery, unknown>({
    queryKey: ['search', query],
    queryFn: async () => client.request(SEARCH, { query }),
    enabled: query.length > 2,
  })

  const rawPages = useMemo(
    () =>
      query.length > 2
        ? (routeList.filter((r) => {
            if (r?.hidden === true) {
              return false
            }

            const nameMatch = r.name?.toLowerCase().includes(query.toLowerCase())
            const keywordMatch = r.keywords?.some((kw: string) => kw.toLowerCase().includes(query.toLowerCase()))
            return nameMatch || keywordMatch
          }) as RoutePage[])
        : [],
    [query],
  )

  const pages = queryData.isFetched ? rawPages : []

  return {
    ...queryData,
    pages,
    data: query.length > 2 ? queryData.data : undefined,
  }
}

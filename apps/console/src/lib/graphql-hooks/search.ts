import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import routeList from '@/route-list.json'
import type { RoutePage } from '@/types'
import { SEARCH } from '@repo/codegen/query/search'
import type { SearchQuery } from '@repo/codegen/src/schema'

export type SearchContextResult = {
  entityID: string
  entityType: string
  matchedFields: string[]
  snippets: {
    field: string
    text: string
  }[]
  primaryLabel: string
  subcontrolParentId?: string
  controlOwnerID?: string | null
}

export type SearchContextGroup = {
  entityType: string
  results: SearchContextResult[]
}

type SearchContextLabelData = {
  primaryLabel: string
  subcontrolParentId?: string
  controlOwnerID?: string | null
}

type SearchContextLabelLookup = Map<string, SearchContextLabelData>

const getLabelLookupKey = (entityType: string, entityID: string) => `${entityType}:${entityID}`

export const buildSearchContextLabelLookup = (search?: SearchQuery['search']): SearchContextLabelLookup => {
  const lookup = new Map<string, SearchContextLabelData>()

  for (const edge of search?.controls?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Control', node.id), {
      primaryLabel: node.refCode ?? node.id,
      controlOwnerID: node.ownerID ?? null,
    })
  }

  for (const edge of search?.subcontrols?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Subcontrol', node.id), {
      primaryLabel: node.refCode ?? node.id,
      subcontrolParentId: node.control?.id,
    })
  }

  for (const edge of search?.internalPolicies?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('InternalPolicy', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of search?.procedures?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Procedure', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of search?.programs?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Program', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of search?.tasks?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Task', node.id), {
      primaryLabel: node.title ?? node.id,
    })
  }

  for (const edge of search?.risks?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Risk', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of search?.groups?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Group', node.id), {
      primaryLabel: node.displayName ?? node.name ?? node.id,
    })
  }

  for (const edge of search?.organizations?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Organization', node.id), {
      primaryLabel: node.displayName ?? node.name ?? node.id,
    })
  }

  for (const edge of search?.standards?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Standard', node.id), {
      primaryLabel: node.shortName ?? node.name ?? node.id,
    })
  }

  for (const edge of search?.templates?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Template', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of search?.evidences?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Evidence', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of search?.subprocessors?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Subprocessor', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  return lookup
}

export const enrichSearchContextResults = (results: SearchContextResult[], labelLookup: SearchContextLabelLookup): SearchContextResult[] => {
  return results.map((result) => {
    const labelData = labelLookup.get(getLabelLookupKey(result.entityType, result.entityID))

    return {
      ...result,
      primaryLabel: labelData?.primaryLabel ?? result.entityID,
      subcontrolParentId: labelData?.subcontrolParentId,
      controlOwnerID: labelData?.controlOwnerID,
    }
  })
}

export const useSearch = (query: string) => {
  const { client } = useGraphQLClient()

  const queryData = useQuery<SearchQuery>({
    queryKey: ['search', query],
    queryFn: async () => client.request(SEARCH, { query }),
    enabled: query.length > 2,
  })

  const rawPages = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase()

    if (trimmedQuery.length > 2) {
      const searchTerms = trimmedQuery.split(/\s+/).filter(Boolean)

      return routeList.filter((r) => {
        if (r?.hidden === true) return false
        return searchTerms.every((term) => {
          const nameMatch = r.name?.toLowerCase().includes(term)
          const routeMatch = r.route?.toLowerCase().includes(term)
          const keywordMatch = r.keywords?.some((kw: string) => kw.toLowerCase().includes(term))

          return nameMatch || routeMatch || keywordMatch
        })
      }) as RoutePage[]
    }

    return []
  }, [query])

  const searchData = queryData.data?.search

  const baseContextResults = useMemo<SearchContextResult[]>(() => {
    const rawResults = searchData?.searchContext ?? []

    return rawResults.flatMap((item) => {
      if (!item?.entityID || !item?.entityType) {
        return []
      }

      return [
        {
          entityID: item.entityID,
          entityType: item.entityType,
          primaryLabel: item.entityID,
          matchedFields: item.matchedFields ?? [],
          snippets: (item.snippets ?? []).flatMap((snippet) => {
            if (!snippet?.field || !snippet?.text) {
              return []
            }

            return [
              {
                field: snippet.field,
                text: snippet.text,
              },
            ]
          }),
        },
      ]
    })
  }, [searchData?.searchContext])

  const labelLookup = useMemo(() => buildSearchContextLabelLookup(searchData), [searchData])

  const contextResults = useMemo(() => enrichSearchContextResults(baseContextResults, labelLookup), [baseContextResults, labelLookup])

  const contextGroups = useMemo<SearchContextGroup[]>(() => {
    if (!contextResults.length) return []

    const groupedResults = new Map<string, SearchContextResult[]>()

    for (const result of contextResults) {
      const existing = groupedResults.get(result.entityType)
      if (existing) {
        existing.push(result)
      } else {
        groupedResults.set(result.entityType, [result])
      }
    }

    return Array.from(groupedResults, ([entityType, results]) => ({ entityType, results }))
  }, [contextResults])

  const pages = queryData.isFetched ? rawPages : []
  const shouldExposeResults = query.length > 2

  return {
    ...queryData,
    pages: shouldExposeResults ? pages : [],
    contextResults: shouldExposeResults ? contextResults : [],
    contextGroups: shouldExposeResults ? contextGroups : [],
    data: shouldExposeResults ? queryData.data : undefined,
  }
}

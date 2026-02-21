import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import routeList from '@/route-list.json'
import type { RoutePage } from '@/types'
import { SEARCH, SEARCH_CONTEXT_LABELS } from '@repo/codegen/query/search'
import type { SearchContextLabelsQuery, SearchContextLabelsQueryVariables, SearchQuery } from '@repo/codegen/src/schema'

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

const SEARCH_ENTITY_TYPE_ORDER = ['Control', 'Subcontrol', 'InternalPolicy', 'Procedure', 'Program', 'Task', 'Risk', 'Group', 'Organization']

const LABEL_SUPPORTED_ENTITY_TYPES = ['Control', 'Subcontrol', 'InternalPolicy', 'Procedure', 'Program', 'Task', 'Risk', 'Group', 'Organization'] as const

type SupportedSearchEntityType = (typeof LABEL_SUPPORTED_ENTITY_TYPES)[number]

type SearchContextIdsByType = Record<SupportedSearchEntityType, string[]>

type SearchContextLabelData = {
  primaryLabel: string
  subcontrolParentId?: string
  controlOwnerID?: string | null
}

export type SearchContextLabelLookup = Map<string, SearchContextLabelData>

const getEntityTypeSortWeight = (entityType: string) => {
  const knownIndex = SEARCH_ENTITY_TYPE_ORDER.indexOf(entityType)
  return knownIndex === -1 ? Number.MAX_SAFE_INTEGER : knownIndex
}

const createEmptyIdsByType = (): SearchContextIdsByType => ({
  Control: [],
  Subcontrol: [],
  InternalPolicy: [],
  Procedure: [],
  Program: [],
  Task: [],
  Risk: [],
  Group: [],
  Organization: [],
})

const uniqueSorted = (values: string[]) => Array.from(new Set(values)).sort((left, right) => left.localeCompare(right))

const isSupportedSearchEntityType = (entityType: string): entityType is SupportedSearchEntityType => {
  return (LABEL_SUPPORTED_ENTITY_TYPES as readonly string[]).includes(entityType)
}

const getLabelLookupKey = (entityType: string, entityID: string) => `${entityType}:${entityID}`

export const collectSearchContextIdsByType = (results: SearchContextResult[]): SearchContextIdsByType => {
  const idsByType = createEmptyIdsByType()

  for (const result of results) {
    if (!isSupportedSearchEntityType(result.entityType)) {
      continue
    }

    idsByType[result.entityType].push(result.entityID)
  }

  for (const entityType of LABEL_SUPPORTED_ENTITY_TYPES) {
    idsByType[entityType] = uniqueSorted(idsByType[entityType])
  }

  return idsByType
}

const buildLabelsQueryVariables = (idsByType: SearchContextIdsByType): SearchContextLabelsQueryVariables => ({
  controlsWhere: idsByType.Control.length > 0 ? { idIn: idsByType.Control } : undefined,
  controlsFirst: idsByType.Control.length > 0 ? idsByType.Control.length : undefined,
  includeControls: idsByType.Control.length > 0,

  subcontrolsWhere: idsByType.Subcontrol.length > 0 ? { idIn: idsByType.Subcontrol } : undefined,
  subcontrolsFirst: idsByType.Subcontrol.length > 0 ? idsByType.Subcontrol.length : undefined,
  includeSubcontrols: idsByType.Subcontrol.length > 0,

  internalPoliciesWhere: idsByType.InternalPolicy.length > 0 ? { idIn: idsByType.InternalPolicy } : undefined,
  internalPoliciesFirst: idsByType.InternalPolicy.length > 0 ? idsByType.InternalPolicy.length : undefined,
  includeInternalPolicies: idsByType.InternalPolicy.length > 0,

  proceduresWhere: idsByType.Procedure.length > 0 ? { idIn: idsByType.Procedure } : undefined,
  proceduresFirst: idsByType.Procedure.length > 0 ? idsByType.Procedure.length : undefined,
  includeProcedures: idsByType.Procedure.length > 0,

  programsWhere: idsByType.Program.length > 0 ? { idIn: idsByType.Program } : undefined,
  programsFirst: idsByType.Program.length > 0 ? idsByType.Program.length : undefined,
  includePrograms: idsByType.Program.length > 0,

  tasksWhere: idsByType.Task.length > 0 ? { idIn: idsByType.Task } : undefined,
  tasksFirst: idsByType.Task.length > 0 ? idsByType.Task.length : undefined,
  includeTasks: idsByType.Task.length > 0,

  risksWhere: idsByType.Risk.length > 0 ? { idIn: idsByType.Risk } : undefined,
  risksFirst: idsByType.Risk.length > 0 ? idsByType.Risk.length : undefined,
  includeRisks: idsByType.Risk.length > 0,

  groupsWhere: idsByType.Group.length > 0 ? { idIn: idsByType.Group } : undefined,
  groupsFirst: idsByType.Group.length > 0 ? idsByType.Group.length : undefined,
  includeGroups: idsByType.Group.length > 0,

  organizationsWhere: idsByType.Organization.length > 0 ? { idIn: idsByType.Organization } : undefined,
  organizationsFirst: idsByType.Organization.length > 0 ? idsByType.Organization.length : undefined,
  includeOrganizations: idsByType.Organization.length > 0,
})

export const buildSearchContextLabelLookup = (data?: SearchContextLabelsQuery): SearchContextLabelLookup => {
  const lookup = new Map<string, SearchContextLabelData>()

  for (const edge of data?.controls?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Control', node.id), {
      primaryLabel: node.refCode ?? node.id,
      controlOwnerID: node.ownerID ?? null,
    })
  }

  for (const edge of data?.subcontrols?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Subcontrol', node.id), {
      primaryLabel: node.refCode ?? node.id,
      subcontrolParentId: node.control?.id,
    })
  }

  for (const edge of data?.internalPolicies?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('InternalPolicy', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of data?.procedures?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Procedure', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of data?.programs?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Program', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of data?.tasks?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Task', node.id), {
      primaryLabel: node.title ?? node.id,
    })
  }

  for (const edge of data?.risks?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Risk', node.id), {
      primaryLabel: node.name ?? node.id,
    })
  }

  for (const edge of data?.groups?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Group', node.id), {
      primaryLabel: node.displayName ?? node.name ?? node.id,
    })
  }

  for (const edge of data?.organizations?.edges ?? []) {
    const node = edge?.node
    if (!node?.id) continue

    lookup.set(getLabelLookupKey('Organization', node.id), {
      primaryLabel: node.displayName ?? node.name ?? node.id,
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

  const baseContextResults = useMemo<SearchContextResult[]>(() => {
    const rawResults = queryData.data?.search?.searchContext ?? []

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
  }, [queryData.data?.search?.searchContext])

  const idsByType = useMemo(() => collectSearchContextIdsByType(baseContextResults), [baseContextResults])

  const shouldFetchLabels = query.length > 2 && baseContextResults.length > 0

  const labelsQueryData = useQuery<SearchContextLabelsQuery>({
    queryKey: ['search', 'labels', idsByType],
    queryFn: async () => {
      const variables = buildLabelsQueryVariables(idsByType)
      return client.request<SearchContextLabelsQuery, SearchContextLabelsQueryVariables>(SEARCH_CONTEXT_LABELS, variables)
    },
    enabled: shouldFetchLabels,
  })

  const labelLookup = useMemo(() => buildSearchContextLabelLookup(labelsQueryData.data), [labelsQueryData.data])

  const contextResults = useMemo(() => enrichSearchContextResults(baseContextResults, labelLookup), [baseContextResults, labelLookup])

  const contextGroups = useMemo<SearchContextGroup[]>(() => {
    if (!contextResults.length) return []

    const groupedResults = contextResults.reduce<Map<string, SearchContextResult[]>>((groups, result) => {
      const existing = groups.get(result.entityType)
      if (existing) {
        existing.push(result)
      } else {
        groups.set(result.entityType, [result])
      }

      return groups
    }, new Map())

    return Array.from(groupedResults.entries())
      .sort(([leftType], [rightType]) => {
        const leftWeight = getEntityTypeSortWeight(leftType)
        const rightWeight = getEntityTypeSortWeight(rightType)

        if (leftWeight !== rightWeight) {
          return leftWeight - rightWeight
        }

        return leftType.localeCompare(rightType)
      })
      .map(([entityType, results]) => ({ entityType, results }))
  }, [contextResults])

  const pages = queryData.isFetched ? rawPages : []
  const shouldExposeResults = query.length > 2

  return {
    ...queryData,
    isFetching: queryData.isFetching || labelsQueryData.isFetching,
    isLoading: queryData.isLoading || labelsQueryData.isLoading,
    pages: shouldExposeResults ? pages : [],
    contextResults: shouldExposeResults ? contextResults : [],
    contextGroups: shouldExposeResults ? contextGroups : [],
    data: shouldExposeResults ? queryData.data : undefined,
  }
}

import type { GraphQLClient } from 'graphql-request'
import { getEdgeIds } from '@/components/shared/object-association/utils'

export const EDGE_PAGE_SIZE = 100

const MAX_EDGE_PAGES = 200

const MAX_CONNECTIONS_PER_REQUEST = 10

type PendingEdge = {
  name: string
  cursor: string | null
}

type EdgeConnectionPage = {
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
  edges: Array<{ node: { id: string } | null } | null> | null
}

type EdgeIdsQueryResponse = {
  record: Record<string, EdgeConnectionPage | null> | null
}

const cursorVariableName = (edgeName: string) => `after_${edgeName}`

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const groups: T[][] = []
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size))
  return groups
}

export const buildEdgeIdsQuery = (queryField: string, pending: readonly PendingEdge[]): string => {
  const paged = pending.filter((edge) => edge.cursor !== null)
  const variableDefinitions = ['$id: ID!', ...paged.map((edge) => `$${cursorVariableName(edge.name)}: Cursor`)]
  const selections = pending.map((edge) => {
    const after = edge.cursor === null ? '' : `, after: $${cursorVariableName(edge.name)}`
    return `    ${edge.name}(first: ${EDGE_PAGE_SIZE}${after}) { pageInfo { hasNextPage endCursor } edges { node { id } } }`
  })

  return `query MergeEdgeIds(${variableDefinitions.join(', ')}) {\n  record: ${queryField}(id: $id) {\n${selections.join('\n')}\n  }\n}`
}

export const fetchEdgeIdsByEdgeName = async (client: GraphQLClient, queryField: string, edgeNames: readonly string[], recordId: string): Promise<Map<string, string[]>> => {
  const collected = new Map<string, string[]>(edgeNames.map((name) => [name, []]))
  let pending: PendingEdge[] = edgeNames.map((name) => ({ name, cursor: null }))
  let pagesFetched = 0

  while (pending.length > 0) {
    if (pagesFetched >= MAX_EDGE_PAGES) throw new Error(`Reading linked records stopped after ${MAX_EDGE_PAGES} pages; merging would have transferred only part of them.`)

    const groups = chunk(pending, MAX_CONNECTIONS_PER_REQUEST)
    const responses = await Promise.all(
      groups.map((group) => {
        const variables: Record<string, string> = { id: recordId }
        for (const edge of group) {
          if (edge.cursor !== null) variables[cursorVariableName(edge.name)] = edge.cursor
        }
        return client.request<EdgeIdsQueryResponse>(buildEdgeIdsQuery(queryField, group), variables)
      }),
    )
    pagesFetched += 1

    const stillPaging: PendingEdge[] = []
    responses.forEach((response, groupIndex) => {
      const record = response.record
      if (!record) throw new Error(`Record ${recordId} could not be read while collecting its linked records.`)

      for (const edge of groups[groupIndex]) {
        const page = record[edge.name]
        if (!page) throw new Error(`The "${edge.name}" links on record ${recordId} could not be read; merging would silently drop them.`)

        collected.get(edge.name)?.push(...getEdgeIds(page.edges))

        if (page.pageInfo.hasNextPage && page.pageInfo.endCursor) stillPaging.push({ name: edge.name, cursor: page.pageInfo.endCursor })
      }
    })

    pending = stillPaging
  }

  return collected
}

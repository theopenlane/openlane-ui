export type TConnectionPage<TNode> = {
  pageInfo?: { endCursor?: unknown; hasNextPage?: boolean | null } | null
  edges?: Array<{ node?: TNode | null } | null> | null
}

export const MAX_EXPORT_PAGES = 200

export class ExportTooLargeError extends Error {
  constructor() {
    super('Export exceeded the maximum size. Narrow your filters and try again.')
    this.name = 'ExportTooLargeError'
  }
}

export const fetchAllConnectionNodes = async <TNode>(
  fetchPage: (after: string | null, remaining: number) => Promise<TConnectionPage<TNode> | null | undefined>,
  limit?: number | null,
): Promise<TNode[]> => {
  const nodes: TNode[] = []
  const visitedCursors = new Set<string>()
  const maxNodes = limit ?? Number.POSITIVE_INFINITY
  let after: string | null = null

  for (let page = 0; page < MAX_EXPORT_PAGES; page++) {
    const connection = await fetchPage(after, maxNodes - nodes.length)

    connection?.edges?.forEach((edge) => {
      if (edge?.node && nodes.length < maxNodes) nodes.push(edge.node)
    })

    const endCursor = connection?.pageInfo?.endCursor

    if (nodes.length >= maxNodes || !connection?.pageInfo?.hasNextPage || typeof endCursor !== 'string' || visitedCursors.has(endCursor)) {
      return nodes
    }

    visitedCursors.add(endCursor)
    after = endCursor
  }

  throw new ExportTooLargeError()
}

import type { GraphQLClient } from 'graphql-request'
import { EDGE_PAGE_SIZE, buildEdgeIdsQuery, fetchEdgeIdsByEdgeName } from '../edge-ids-query'

type Page = { pageInfo: { hasNextPage: boolean; endCursor: string | null }; edges: Array<{ node: { id: string } | null } | null> | null }

const page = (ids: string[], endCursor: string | null = null): Page => ({
  pageInfo: { hasNextPage: endCursor !== null, endCursor },
  edges: ids.map((id) => ({ node: { id } })),
})

type Call = { query: string; variables: Record<string, string> }

const clientReturning = (respond: (call: Call, index: number) => unknown) => {
  const calls: Call[] = []
  const client = {
    request: (query: string, variables: Record<string, string>) => {
      const call = { query, variables }
      calls.push(call)
      return Promise.resolve(respond(call, calls.length - 1))
    },
  } as unknown as GraphQLClient
  return { client, calls }
}

const edgeNamesIn = (query: string) => [...query.matchAll(/^\s{4}(\w+)\(first:/gm)].map((match) => match[1])

describe('buildEdgeIdsQuery', () => {
  it('declares only $id when no edge is being paged', () => {
    const query = buildEdgeIdsQuery('control', [{ name: 'programs', cursor: null }])
    expect(query).toContain('query MergeEdgeIds($id: ID!)')
    expect(query).not.toContain('$after_')
  })

  it('asks for one page of every requested edge', () => {
    const query = buildEdgeIdsQuery('control', [
      { name: 'programs', cursor: null },
      { name: 'risks', cursor: null },
    ])
    expect(edgeNamesIn(query)).toEqual(['programs', 'risks'])
    expect(query).toContain(`programs(first: ${EDGE_PAGE_SIZE})`)
  })

  it('adds a cursor variable only for the edges that are still paging', () => {
    const query = buildEdgeIdsQuery('control', [
      { name: 'programs', cursor: 'cur_programs' },
      { name: 'risks', cursor: null },
    ])
    expect(query).toContain('$after_programs: Cursor')
    expect(query).not.toContain('$after_risks')
    expect(query).toContain(`programs(first: ${EDGE_PAGE_SIZE}, after: $after_programs)`)
    expect(query).toContain(`risks(first: ${EDGE_PAGE_SIZE})`)
  })

  it('aliases the record so the response shape is independent of the query field', () => {
    expect(buildEdgeIdsQuery('internalPolicy', [{ name: 'controls', cursor: null }])).toContain('record: internalPolicy(id: $id)')
  })

  it('selects the page info and node ids needed to page and collect', () => {
    const query = buildEdgeIdsQuery('control', [{ name: 'programs', cursor: null }])
    expect(query).toContain('pageInfo { hasNextPage endCursor }')
    expect(query).toContain('edges { node { id } }')
  })
})

describe('fetchEdgeIdsByEdgeName', () => {
  it('returns an entry for every requested edge, empty ones included', async () => {
    const { client } = clientReturning(() => ({ record: { programs: page(['p1']), risks: page([]) } }))
    const result = await fetchEdgeIdsByEdgeName(client, 'control', ['programs', 'risks'], 'ctl_1')
    expect(result.get('programs')).toEqual(['p1'])
    expect(result.get('risks')).toEqual([])
  })

  it('passes the record id on every request', async () => {
    const { client, calls } = clientReturning(() => ({ record: { programs: page(['p1']) } }))
    await fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')
    expect(calls[0].variables.id).toBe('ctl_1')
  })

  it('follows the cursor until the connection reports no next page', async () => {
    const pages = [page(['p1'], 'cur_1'), page(['p2'], 'cur_2'), page(['p3'])]
    const { client, calls } = clientReturning((_call, index) => ({ record: { programs: pages[index] } }))
    const result = await fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')
    expect(result.get('programs')).toEqual(['p1', 'p2', 'p3'])
    expect(calls).toHaveLength(3)
    expect(calls[1].variables.after_programs).toBe('cur_1')
    expect(calls[2].variables.after_programs).toBe('cur_2')
  })

  it('stops paging an exhausted edge while another keeps going', async () => {
    const { client, calls } = clientReturning((_call, index) => (index === 0 ? { record: { programs: page(['p1'], 'cur_1'), risks: page(['r1']) } } : { record: { programs: page(['p2']) } }))
    const result = await fetchEdgeIdsByEdgeName(client, 'control', ['programs', 'risks'], 'ctl_1')
    expect(result.get('programs')).toEqual(['p1', 'p2'])
    expect(result.get('risks')).toEqual(['r1'])
    expect(edgeNamesIn(calls[1].query)).toEqual(['programs'])
  })

  it('ignores a hasNextPage that arrives without a cursor rather than looping forever', async () => {
    const { client, calls } = clientReturning(() => ({ record: { programs: { pageInfo: { hasNextPage: true, endCursor: null }, edges: [{ node: { id: 'p1' } }] } } }))
    const result = await fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')
    expect(result.get('programs')).toEqual(['p1'])
    expect(calls).toHaveLength(1)
  })

  it('splits more than ten connections across parallel requests', async () => {
    const names = Array.from({ length: 23 }, (_unused, index) => `edge${index}`)
    const { client, calls } = clientReturning((call) => ({
      record: Object.fromEntries(edgeNamesIn(call.query).map((name) => [name, page([`${name}_id`])])),
    }))
    const result = await fetchEdgeIdsByEdgeName(client, 'control', names, 'ctl_1')
    expect(calls).toHaveLength(3)
    expect(calls.flatMap((call) => edgeNamesIn(call.query))).toEqual(names)
    expect(result.get('edge22')).toEqual(['edge22_id'])
  })

  it('skips null edges and null nodes in a page', async () => {
    const { client } = clientReturning(() => ({ record: { programs: { pageInfo: { hasNextPage: false, endCursor: null }, edges: [null, { node: null }, { node: { id: 'p1' } }] } } }))
    const result = await fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')
    expect(result.get('programs')).toEqual(['p1'])
  })

  it('treats a null edges array as an empty page', async () => {
    const { client } = clientReturning(() => ({ record: { programs: { pageInfo: { hasNextPage: false, endCursor: null }, edges: null } } }))
    expect((await fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')).get('programs')).toEqual([])
  })

  it('makes no request when there is no edge to read', async () => {
    const { client, calls } = clientReturning(() => ({ record: {} }))
    expect((await fetchEdgeIdsByEdgeName(client, 'control', [], 'ctl_1')).size).toBe(0)
    expect(calls).toHaveLength(0)
  })

  it('fails loudly when the record cannot be read', async () => {
    const { client } = clientReturning(() => ({ record: null }))
    expect(fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')).rejects.toThrow('Record ctl_1 could not be read')
  })

  it('fails loudly rather than dropping an edge the response omitted', async () => {
    const { client } = clientReturning(() => ({ record: { programs: page(['p1']) } }))
    expect(fetchEdgeIdsByEdgeName(client, 'control', ['programs', 'risks'], 'ctl_1')).rejects.toThrow('The "risks" links on record ctl_1 could not be read')
  })

  it('propagates a transport error instead of returning a partial map', async () => {
    const client = { request: () => Promise.reject(new Error('network down')) } as unknown as GraphQLClient
    expect(fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')).rejects.toThrow('network down')
  })

  it('gives up once the page budget is exhausted rather than transferring a partial set', async () => {
    const { client } = clientReturning((_call, index) => ({ record: { programs: page([`p${index}`], `cur_${index}`) } }))
    expect(fetchEdgeIdsByEdgeName(client, 'control', ['programs'], 'ctl_1')).rejects.toThrow('stopped after 200 pages')
  })
})

import type { TReportEdge, TReportFieldKind } from '@repo/codegen/src/report-schema.generated'
import type { TPagination } from '@repo/ui/pagination-types'
import { htmlToText } from '@/lib/html/html-to-text'
import { formatDateTime } from '@/utils/date'
import { sliceByPagination } from '@/utils/pagination'
import { edgeChainPath, isListChain, pathLabel, type TReportColumn } from './report-schema'

export type TReportRow = Record<string, unknown>

export type TReportNode = Record<string, unknown>

export type TReportPageInfo = {
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  startCursor?: string | null
  endCursor?: string | null
}

export type TReportResult = {
  totalCount: number
  matchedCount: number
  pageInfo?: TReportPageInfo
  columns: TReportColumn[]
  nodes: TReportNode[]
}

export const nodesForPage = (result: TReportResult, pagination: TPagination): TReportNode[] => (result.pageInfo ? result.nodes : sliceByPagination(result.nodes, pagination))

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const edgeNodes = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value.filter(isRecord)
  if (isRecord(value) && Array.isArray(value.edges)) {
    return value.edges.map((edge) => (isRecord(edge) ? edge.node : null)).filter(isRecord)
  }
  return []
}

const relatedNodes = (node: TReportNode | null, edge: TReportEdge): TReportNode[] => {
  if (!node) return []

  const related = node[edge.name]
  if (!edge.list) return isRecord(related) ? [related] : []

  return edgeNodes(related)
}

const rawCellValue = (start: TReportNode | null, edges: TReportEdge[], column: TReportColumn): unknown => {
  const reached = edges.reduce<TReportNode[]>((nodes, edge) => nodes.flatMap((node) => relatedNodes(node, edge)), start ? [start] : [])
  const values = reached.map((item) => item[column.field.name])

  return isListChain(edges) ? values : (values[0] ?? null)
}

const asPlainText = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(asPlainText)
  if (isRecord(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, asPlainText(item)]))

  return typeof value === 'string' ? htmlToText(value) : value
}

const RICH_TEXT_KINDS: ReadonlySet<TReportFieldKind> = new Set(['string', 'json'])

const cellValue = (start: TReportNode | null, edges: TReportEdge[], column: TReportColumn): unknown => {
  const value = rawCellValue(start, edges, column)

  return RICH_TEXT_KINDS.has(column.field.kind) ? asPlainText(value) : value
}

type TRowContext = (TReportNode | null)[]

const expandContexts = (node: TReportNode, rowPer: TReportEdge[]): TRowContext[] =>
  rowPer.reduce<TRowContext[]>(
    (contexts, edge) =>
      contexts.flatMap((context) => {
        const children = relatedNodes(context.at(-1) ?? null, edge)

        return children.length > 0 ? children.map((child) => [...context, child]) : [[...context, null]]
      }),
    [[node]],
  )

const sharedPrefixLength = (edges: TReportEdge[], rowPer: TReportEdge[]): number => {
  let length = 0
  while (length < edges.length && length < rowPer.length && edges[length].name === rowPer[length].name) length += 1

  return length
}

export const flattenRows = (nodes: TReportNode[], columns: TReportColumn[], rowPer: TReportEdge[] = []): TReportRow[] => {
  const anchored = columns.map((column) => {
    const depth = sharedPrefixLength(column.edges, rowPer)

    return { column, depth, rest: column.edges.slice(depth) }
  })

  return nodes.flatMap((node) =>
    expandContexts(node, rowPer).map((context) => Object.fromEntries(anchored.map(({ column, depth, rest }) => [column.path, cellValue(context[depth] ?? null, rest, column)]))),
  )
}

export type TRowPerOption = {
  path: string
  label: string
  chain: TReportEdge[]
}

export const rowPerOptions = (columns: TReportColumn[]): TRowPerOption[] => {
  const chains = new Map<string, TReportEdge[]>()

  for (const column of columns) {
    column.edges.forEach((edge, index) => {
      const chain = column.edges.slice(0, index + 1)
      if (edge.list) chains.set(edgeChainPath(chain), chain)
    })
  }

  return [...chains.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([path, chain]) => ({ path, label: pathLabel(path), chain }))
}

const formatTime = (value: string): string => (Number.isNaN(new Date(value).getTime()) ? value : formatDateTime(value, ''))

export const formatCell = (value: unknown, kind?: TReportFieldKind): string => {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value))
    return value
      .map((item) => formatCell(item, kind))
      .filter(Boolean)
      .join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  if (kind === 'time') return formatTime(String(value))

  return String(value)
}

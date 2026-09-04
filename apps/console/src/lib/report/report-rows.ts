import type { TReportFieldKind } from '@repo/codegen/src/report-schema.generated'
import { formatDateTime } from '@/utils/date'
import type { TReportColumn } from './report-schema'

export type TReportRow = Record<string, unknown>

export type TReportResult = {
  totalCount: number
  pageInfo: {
    hasNextPage?: boolean
    hasPreviousPage?: boolean
    startCursor?: string | null
    endCursor?: string | null
  }
  columns: TReportColumn[]
  rows: TReportRow[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const edgeNodes = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) return value.filter(isRecord)
  if (isRecord(value) && Array.isArray(value.edges)) {
    return value.edges.map((edge) => (isRecord(edge) ? edge.node : null)).filter(isRecord)
  }
  return []
}

const cellValue = (node: Record<string, unknown>, column: TReportColumn): unknown => {
  if (!column.edge) return node[column.field.name]

  const related = node[column.edge.name]
  if (!column.edge.list) return isRecord(related) ? related[column.field.name] : null

  return edgeNodes(related).map((item) => item[column.field.name])
}

export const flattenRows = (nodes: Record<string, unknown>[], columns: TReportColumn[]): TReportRow[] =>
  nodes.map((node) => Object.fromEntries(columns.map((column) => [column.path, cellValue(node, column)])))

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

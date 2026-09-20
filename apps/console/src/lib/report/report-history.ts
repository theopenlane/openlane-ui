import { REPORT_OPERATOR_SUFFIX, type TReportOperator } from '@repo/codegen/src/report-schema.generated'
import { OrderDirection } from '@repo/codegen/src/schema'
import { createOrgPersistedStore } from '@/lib/storage/org-persisted-store'
import { isRecord, isStringArray } from '@/utils/type-guards'
import { buildOrder, reconcileReportConfig, type TReportQueryConfig } from './report-config'
import { buildWhere, type TReportFilter } from './report-filters'
import { getEntity, type TReportSort } from './report-schema'

export const MAX_REPORT_HISTORY = 10

const REPORT_HISTORY_KEY = 'custom-report-history'

export type TReportHistoryEntry = TReportQueryConfig & {
  id: string
  runAt: string
}

const querySignature = (config: TReportQueryConfig): string => {
  const entity = getEntity(config.entityName)

  return JSON.stringify({
    entityName: config.entityName,
    columnPaths: config.columnPaths,
    where: entity ? buildWhere(config.filters, entity, config.combinator) : null,
    orderBy: buildOrder(config.sort),
    limit: config.limit,
  })
}

export const addReportHistoryEntry = (entries: TReportHistoryEntry[], config: TReportQueryConfig, runAt: string): TReportHistoryEntry[] => {
  const signature = querySignature(config)
  const matchesSignature = (entry: TReportHistoryEntry): boolean => querySignature(reconcileReportConfig(entry) ?? entry) === signature

  return [{ ...config, id: crypto.randomUUID(), runAt }, ...entries.filter((entry) => !matchesSignature(entry))].slice(0, MAX_REPORT_HISTORY)
}

const isReportOperator = (value: string): value is TReportOperator => Object.hasOwn(REPORT_OPERATOR_SUFFIX, value)

const isOrderDirection = (value: string): value is OrderDirection => value === OrderDirection.ASC || value === OrderDirection.DESC

const parseFilters = (value: unknown): TReportFilter[] | null => {
  if (!Array.isArray(value)) return null

  const filters: TReportFilter[] = []

  for (const item of value) {
    if (!isRecord(item)) return null

    const { id, field, operator, value: filterValue } = item

    if (typeof id !== 'string' || typeof field !== 'string' || typeof filterValue !== 'string') return null
    if (typeof operator !== 'string' || !isReportOperator(operator)) return null

    filters.push({ id, field, operator, value: filterValue })
  }

  return filters
}

const parseSort = (value: unknown): TReportSort | null => {
  if (!isRecord(value)) return null

  const { field, direction } = value

  if (field !== null && typeof field !== 'string') return null
  if (typeof direction !== 'string' || !isOrderDirection(direction)) return null

  return { field, direction }
}

const parseEntry = (value: unknown): TReportHistoryEntry | null => {
  if (!isRecord(value)) return null

  const { id, entityName, columnPaths, filters, combinator, sort, limit, runAt } = value

  if (typeof id !== 'string' || typeof entityName !== 'string' || !isStringArray(columnPaths)) return null
  if (combinator !== 'and' && combinator !== 'or') return null
  if (limit !== null && (typeof limit !== 'number' || !Number.isInteger(limit) || limit <= 0)) return null
  if (typeof runAt !== 'string' || Number.isNaN(Date.parse(runAt))) return null

  const parsedSort = parseSort(sort)
  if (parsedSort === null) return null

  const parsedFilters = parseFilters(filters)
  if (parsedFilters === null) return null

  return { id, entityName, columnPaths, filters: parsedFilters, combinator, sort: parsedSort, limit, runAt }
}

export const parseReportHistory = (raw: string): TReportHistoryEntry[] | null => {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null

    return parsed
      .slice(0, MAX_REPORT_HISTORY)
      .map(parseEntry)
      .filter((entry) => entry !== null)
  } catch {
    return null
  }
}

export const reportHistoryStore = createOrgPersistedStore<TReportHistoryEntry[]>(REPORT_HISTORY_KEY, parseReportHistory, () => [])

import { createOrgPersistedStore } from '@/lib/storage/org-persisted-store'
import { isRecord } from '@/utils/type-guards'
import { buildOrder, parseReportQueryConfig, reconcileReportConfig, type TReportQueryConfig } from './report-config'
import { buildWhere } from './report-filters'
import { getEntity } from './report-schema'

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

const parseEntry = (value: unknown): TReportHistoryEntry | null => {
  if (!isRecord(value)) return null

  const { id, runAt } = value

  if (typeof id !== 'string') return null
  if (typeof runAt !== 'string' || Number.isNaN(Date.parse(runAt))) return null

  const config = parseReportQueryConfig(value)

  return config ? { ...config, id, runAt } : null
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

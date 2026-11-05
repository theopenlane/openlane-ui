import { REPORT_OPERATOR_SUFFIX, type TReportEntity, type TReportOperator } from '@repo/codegen/src/report-schema.generated'
import { OrderDirection } from '@repo/codegen/src/schema'
import { toHumanLabel } from '@/utils/strings'
import { isRecord, isStringArray } from '@/utils/type-guards'
import { filterOperators, isFilterComplete, listValues, resolveFilterField, type TReportFilter } from './report-filters'
import { isOwnerColumn, migrateLegacyOwnerFilter } from './report-owner-filters'
import { getEntity, pathEdgeName, pathLabel, resolveColumn, type TReportCombinator, type TReportOrder, type TReportSort } from './report-schema'

export type TReportQueryConfig = {
  entityName: string
  columnPaths: string[]
  filters: TReportFilter[]
  combinator: TReportCombinator
  sort: TReportSort
  limit: number | null
}

export const DEFAULT_REPORT_SORT: TReportSort = { field: null, direction: OrderDirection.ASC }

export const emptyReportConfig = (): TReportQueryConfig => ({ entityName: '', columnPaths: [], filters: [], combinator: 'and', sort: DEFAULT_REPORT_SORT, limit: null })

export const reportConfigForEntity = (entity: TReportEntity): TReportQueryConfig => ({
  entityName: entity.queryName,
  columnPaths: entity.defaultFields,
  filters: [],
  combinator: 'and',
  sort: DEFAULT_REPORT_SORT,
  limit: null,
})

export const buildOrder = ({ field, direction }: TReportSort): TReportOrder | null => (field ? { field, direction } : null)

export const reconcileReportConfig = (config: TReportQueryConfig): TReportQueryConfig | null => {
  const entity = getEntity(config.entityName)
  if (!entity) return null

  const columnPaths = config.columnPaths.filter((path) => resolveColumn(entity, path) !== undefined)
  if (columnPaths.length === 0) return null

  const isValid = (filter: TReportFilter): boolean => {
    const field = resolveFilterField(entity, filter.field)?.field

    return field !== undefined && filterOperators(field).includes(filter.operator) && isFilterComplete(filter, field)
  }

  const migratedFilters = config.filters.map((filter) => {
    if (isValid(filter)) return filter

    const migrated = migrateLegacyOwnerFilter(entity, { field: filter.field, operator: filter.operator, values: listValues(filter.value) })

    return migrated ? { ...filter, ...migrated } : filter
  })

  if (migratedFilters.some((filter) => !isValid(filter) && isOwnerColumn(entity, filter.field))) return null

  const filters = migratedFilters.filter(isValid)

  const sortable = entity.order?.fields ?? []
  const sort = config.sort.field !== null && !sortable.includes(config.sort.field) ? DEFAULT_REPORT_SORT : config.sort

  return { entityName: config.entityName, columnPaths, filters, combinator: config.combinator, sort, limit: config.limit }
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

export const parseReportQueryConfig = (value: unknown): TReportQueryConfig | null => {
  if (!isRecord(value)) return null

  const { entityName, columnPaths, filters, combinator, sort, limit } = value

  if (typeof entityName !== 'string' || !isStringArray(columnPaths)) return null
  if (combinator !== 'and' && combinator !== 'or') return null
  if (limit !== null && (typeof limit !== 'number' || !Number.isInteger(limit) || limit <= 0)) return null

  const parsedSort = parseSort(sort)
  if (parsedSort === null) return null

  const parsedFilters = parseFilters(filters)
  if (parsedFilters === null) return null

  return { entityName, columnPaths, filters: parsedFilters, combinator, sort: parsedSort, limit }
}

const MAX_DESCRIBED_PARTS = 2

const unique = (values: string[]): string[] => [...new Set(values)]

const joinLabels = (names: string[]): string =>
  names
    .slice(0, MAX_DESCRIBED_PARTS)
    .map(pathLabel)
    .concat(names.length > MAX_DESCRIBED_PARTS ? ['…'] : [])
    .join(', ')

export const describeReportQuery = (config: TReportQueryConfig): string => {
  const object = toHumanLabel(config.entityName)
  const edges = unique(config.columnPaths.map(pathEdgeName).filter((name) => name !== null))
  const filterFields = unique(config.filters.map((filter) => filter.field))
  const filtered = filterFields.length > 0 ? `filtered by ${joinLabels(filterFields)}` : ''

  if (edges.length === 0) return filtered === '' ? object : `${object} ${filtered}`

  return `${object} with ${joinLabels(edges)}${filtered === '' ? '' : ` (${filtered})`}`
}

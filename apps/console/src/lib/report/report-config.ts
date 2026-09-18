import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { OrderDirection } from '@repo/codegen/src/schema'
import { toHumanLabel } from '@/utils/strings'
import { defaultFilters, isFilterComplete, type TReportCombinator, type TReportFilter } from './report-filters'
import { getColumnIndex, getEntity, getFieldOperators, pathEdgeName, type TReportOrder, type TReportSort } from './report-schema'

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
  filters: defaultFilters(entity),
  combinator: 'and',
  sort: DEFAULT_REPORT_SORT,
  limit: null,
})

export const buildOrder = ({ field, direction }: TReportSort): TReportOrder | null => (field ? { field, direction } : null)

export const reconcileReportConfig = (config: TReportQueryConfig): TReportQueryConfig | null => {
  const entity = getEntity(config.entityName)
  if (!entity) return null

  const columnIndex = getColumnIndex(entity)
  const columnPaths = config.columnPaths.filter((path) => columnIndex.has(path))
  if (columnPaths.length === 0) return null

  const fieldsByName = new Map(entity.fields.map((field) => [field.name, field]))

  const filters = config.filters.filter((filter) => {
    const field = fieldsByName.get(filter.field)

    return field !== undefined && getFieldOperators(field).includes(filter.operator) && isFilterComplete(filter, field)
  })

  const sortable = entity.order?.fields ?? []
  const sort = config.sort.field !== null && !sortable.includes(config.sort.field) ? DEFAULT_REPORT_SORT : config.sort

  return { entityName: config.entityName, columnPaths, filters, combinator: config.combinator, sort, limit: config.limit }
}

const MAX_DESCRIBED_PARTS = 2

const unique = (values: string[]): string[] => [...new Set(values)]

const joinLabels = (names: string[]): string =>
  names
    .slice(0, MAX_DESCRIBED_PARTS)
    .map(toHumanLabel)
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

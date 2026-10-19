import {
  REPORT_OWNER_OPERATORS,
  type TReportEdge,
  type TReportEntity,
  type TReportField,
  type TReportFieldKind,
  type TReportOperator,
  type TReportOwner,
} from '@repo/codegen/src/report-schema.generated'
import {
  buildPath,
  combineClauses,
  edgeChainPath,
  getEdgeFields,
  getFieldOperators,
  getRelatedEdges,
  getTargetEntity,
  labelledEdges,
  MAX_EDGE_DEPTH,
  pathLabel,
  PATH_SEPARATOR,
  pathSegments,
  splitFieldPath,
  wherePredicate,
  type TReportCombinator,
  type TWhereClause,
} from './report-schema'
import { toHumanLabel } from '@/utils/strings'
import { isOwnerFilterComplete, ownerColumnNames, ownerFilterClause, toOwnerFilterField, type TOwnerFilterField } from './report-owner-filters'

export type TReportFilterField = TReportField | TOwnerFilterField

export type TReportFilter = {
  id: string
  field: string
  operator: TReportOperator
  value: string
}

export const MAX_FILTERS = 5

const SYSTEM_OWNED_FIELD = 'systemOwned'

export const filterOperators = (field: TReportFilterField): TReportOperator[] => (field.kind === 'owner' ? REPORT_OWNER_OPERATORS : getFieldOperators(field))

const filterableByFieldList = new WeakMap<TReportField[], Map<string, TReportFilterField>>()

const filterableFieldsByName = (fields: TReportField[], owners: TReportOwner[]): Map<string, TReportFilterField> => {
  const cached = filterableByFieldList.get(fields)
  if (cached) return cached

  const ownerColumns = new Set(owners.flatMap(ownerColumnNames))
  const scalarFields = fields.filter((field) => field.name !== SYSTEM_OWNED_FIELD && !ownerColumns.has(field.name) && getFieldOperators(field).length > 0)
  const byName = new Map<string, TReportFilterField>([...scalarFields, ...owners.map(toOwnerFilterField)].map((field) => [field.name, field]))

  filterableByFieldList.set(fields, byName)

  return byName
}

const relatedFilterFields = (edge: TReportEdge): Map<string, TReportFilterField> => filterableFieldsByName(getEdgeFields(edge), getTargetEntity(edge)?.owners ?? [])

const filterFieldsAlong = (entity: TReportEntity, edges: TReportEdge[]): Map<string, TReportFilterField> => {
  const last = edges.at(-1)

  return last ? relatedFilterFields(last) : filterableFieldsByName(entity.fields, entity.owners)
}

export type TFilterRecord = {
  key: string
  path: string
  label: string
  edges: TReportEdge[]
}

const OWN_RECORD_KEY = PATH_SEPARATOR

const filterableEdges = (edges: TReportEdge[]): TReportEdge[] => edges.filter((edge) => edge.filterPredicate && relatedFilterFields(edge).size > 0)

const filterRecordsByEntity = new WeakMap<TReportEntity, TFilterRecord[]>()

export const filterRecords = (entity: TReportEntity): TFilterRecord[] => {
  const cached = filterRecordsByEntity.get(entity)
  if (cached) return cached

  const records: TFilterRecord[] = [{ key: OWN_RECORD_KEY, path: '', label: toHumanLabel(entity.typeName), edges: [] }]

  const visit = (edges: TReportEdge[], chain: TReportEdge[]) => {
    for (const { item: edge } of labelledEdges(filterableEdges(edges))) {
      const next = [...chain, edge]
      const path = edgeChainPath(next)

      records.push({ key: path, path, label: pathLabel(path), edges: next })
      if (next.length < MAX_EDGE_DEPTH) visit(getRelatedEdges(edge), next)
    }
  }

  visit(entity.edges, [])
  filterRecordsByEntity.set(entity, records)

  return records
}

export const filterableFields = (entity: TReportEntity, record: TFilterRecord): TReportFilterField[] => [...filterFieldsAlong(entity, record.edges).values()]

export const filterPath = (record: TFilterRecord, field: TReportFilterField): string => buildPath(record.path, field.name)

export type TResolvedFilterField = {
  field: TReportFilterField
  recordPath: string
  predicates: string[]
}

export const resolveFilterField = (entity: TReportEntity, path: string): TResolvedFilterField | undefined => {
  const split = splitFieldPath(entity, path)
  if (!split) return undefined

  const predicates = split.edges.map((edge) => edge.filterPredicate).filter((predicate) => predicate !== undefined)
  const field = predicates.length === split.edges.length ? filterFieldsAlong(entity, split.edges).get(split.fieldName) : undefined

  return field ? { field, recordPath: edgeChainPath(split.edges), predicates } : undefined
}

const withinEdges = (clause: TWhereClause, predicates: string[]): TWhereClause => predicates.reduceRight<TWhereClause>((inner, predicate) => ({ [predicate]: [inner] }), clause)

export const LIST_VALUE_SEPARATOR = ','

const MS_PER_DAY = 24 * 60 * 60 * 1000

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const OPERATOR_LABELS: Record<TReportOperator, string> = {
  eq: 'equals',
  neq: 'does not equal',
  in: 'is any of',
  notIn: 'is none of',
  gt: 'is greater than',
  gte: 'is greater than or equal to',
  lt: 'is less than',
  lte: 'is less than or equal to',
  contains: 'contains',
  containsFold: 'contains (ignoring case)',
  equalFold: 'equals (ignoring case)',
  hasPrefix: 'starts with',
  hasSuffix: 'ends with',
  isNil: 'is empty',
  notNil: 'is not empty',
  has: 'includes',
}

const TIME_OPERATOR_LABELS: Partial<Record<TReportOperator, string>> = {
  gt: 'is after',
  gte: 'is on or after',
  lt: 'is before',
  lte: 'is on or before',
}

export const operatorLabel = (operator: TReportOperator, kind: TReportFilterField['kind']): string =>
  kind === 'time' ? (TIME_OPERATOR_LABELS[operator] ?? OPERATOR_LABELS[operator]) : OPERATOR_LABELS[operator]

export type TFilterValueInput = 'none' | 'owner' | 'enumList' | 'list' | 'enum' | 'boolean' | 'number' | 'date' | 'text'

export const filterValueInput = (field: TReportFilterField, operator: TReportOperator): TFilterValueInput => {
  if (operator === 'isNil' || operator === 'notNil') return 'none'
  if (field.kind === 'owner') return 'owner'
  if (operator === 'in' || operator === 'notIn') return field.kind === 'enum' ? 'enumList' : 'list'
  if (field.kind === 'enum') return 'enum'
  if (field.kind === 'boolean') return 'boolean'
  if (field.kind === 'int' || field.kind === 'float') return 'number'
  if (field.kind === 'time') return 'date'
  return 'text'
}

export const listValues = (value: string): string[] =>
  value
    .split(LIST_VALUE_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean)

const toUtcInstant = (raw: string): Date | null => {
  const parsed = DATE_ONLY.test(raw) ? new Date(`${raw}T00:00:00Z`) : new Date(raw)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toStorageTime = (value: Date): string => value.toISOString().replace(/\.\d{3}Z$/, 'Z')

const INTEGER = /^-?\d+$/

const coerceScalar = (raw: string, kind: TReportFieldKind): string | number | boolean | null => {
  const trimmed = raw.trim()

  if (kind === 'int') return INTEGER.test(trimmed) ? Number.parseInt(trimmed, 10) : null
  if (kind === 'float') return trimmed !== '' && Number.isFinite(Number(trimmed)) ? Number(trimmed) : null
  if (kind === 'boolean') return trimmed === 'true'
  if (kind === 'time') {
    const parsed = toUtcInstant(trimmed)
    return parsed ? toStorageTime(parsed) : null
  }
  return raw
}

const coerceValue = (filter: TReportFilter, field: TReportField): unknown => {
  const input = filterValueInput(field, filter.operator)

  if (input === 'none') return true
  if (input === 'list' || input === 'enumList') {
    const values = listValues(filter.value).map((part) => coerceScalar(part, field.kind))

    return values.some((value) => value === null) ? null : values
  }

  return coerceScalar(filter.value, field.kind)
}

export const isFilterComplete = (filter: TReportFilter, field: TReportFilterField | undefined): boolean => {
  if (!field) return false
  if (field.kind === 'owner') return isOwnerFilterComplete(field, filter.operator, filter.value)

  const input = filterValueInput(field, filter.operator)

  if (input === 'none') return true
  if (input === 'list' || input === 'enumList') {
    const values = listValues(filter.value)

    return values.length > 0 && values.every((value) => coerceScalar(value, field.kind) !== null)
  }
  if (input === 'number' || input === 'date') return coerceScalar(filter.value, field.kind) !== null

  return filter.value.trim() !== ''
}

const isDateOnly = (filter: TReportFilter, field: TReportField): boolean => field.kind === 'time' && DATE_ONLY.test(filter.value.trim())

const dayClause = (filter: TReportFilter, fieldName: string): TWhereClause | null => {
  const start = toUtcInstant(filter.value.trim())
  if (!start) return null

  const startOfDay = toStorageTime(start)
  const startOfNextDay = toStorageTime(new Date(start.getTime() + MS_PER_DAY))

  if (filter.operator === 'eq') return { [`${fieldName}GTE`]: startOfDay, [`${fieldName}LT`]: startOfNextDay }
  if (filter.operator === 'gt') return { [`${fieldName}GTE`]: startOfNextDay }
  if (filter.operator === 'lte') return { [`${fieldName}LT`]: startOfNextDay }

  return null
}

const DAY_BOUNDED_OPERATORS: TReportOperator[] = ['eq', 'gt', 'lte']

const filterClause = (filter: TReportFilter, field: TReportFilterField): TWhereClause | null => {
  if (field.kind === 'owner') return ownerFilterClause(field, filter.operator, filter.value)
  if (isDateOnly(filter, field) && DAY_BOUNDED_OPERATORS.includes(filter.operator)) return dayClause(filter, field.name)

  const value = coerceValue(filter, field)

  return value === null ? null : wherePredicate(field.name, filter.operator, value)
}

export const excludeSystemOwnedWhere = (entity: TReportEntity): TWhereClause | null => {
  const field = entity.fields.find((item) => item.name === SYSTEM_OWNED_FIELD)

  return field && getFieldOperators(field).includes('eq') ? wherePredicate(SYSTEM_OWNED_FIELD, 'eq', false) : null
}

export const incompleteFilterCount = (filters: TReportFilter[], entity: TReportEntity): number =>
  filters.filter((filter) => !isFilterComplete(filter, resolveFilterField(entity, filter.field)?.field)).length

const NEGATED_OPERATORS: Partial<Record<TReportOperator, TReportOperator>> = { neq: 'eq', notIn: 'in' }

export const negatedRelatedOperator = (operator: TReportOperator, record: TFilterRecord): TReportOperator | undefined => (record.edges.length > 0 ? NEGATED_OPERATORS[operator] : undefined)

type TFilterPart = {
  recordPath: string
  predicates: string[]
  negated: boolean
  clause: TWhereClause
}

const filterParts = (filters: TReportFilter[], entity: TReportEntity): TFilterPart[] =>
  filters.flatMap((filter) => {
    const resolved = resolveFilterField(entity, filter.field)
    if (!resolved || !isFilterComplete(filter, resolved.field)) return []

    const positive = resolved.predicates.length > 0 ? NEGATED_OPERATORS[filter.operator] : undefined
    const clause = filterClause(positive ? { ...filter, operator: positive } : filter, resolved.field)

    return clause ? [{ recordPath: resolved.recordPath, predicates: resolved.predicates, negated: positive !== undefined, clause }] : []
  })

const negate = (clause: TWhereClause, negated: boolean): TWhereClause => (negated ? { not: clause } : clause)

const groupKey = (part: TFilterPart, index: number, combinator: TReportCombinator): string =>
  combinator === 'and' && !part.negated && part.predicates.length > 0 ? `record:${part.recordPath}` : `filter:${index}`

export const buildWhere = (filters: TReportFilter[], entity: TReportEntity, combinator: TReportCombinator): TWhereClause | null => {
  const groups = new Map<string, TFilterPart[]>()

  filterParts(filters, entity).forEach((part, index) => {
    const key = groupKey(part, index, combinator)
    groups.set(key, [...(groups.get(key) ?? []), part])
  })

  const clauses = [...groups.values()].flatMap(([first, ...rest]) => {
    const inner = combineClauses(
      'and',
      [first, ...rest].map((part) => part.clause),
    )

    return inner ? [negate(withinEdges(inner, first.predicates), first.negated)] : []
  })

  return combineClauses(combinator, clauses)
}

export const buildRelatedWhere = (filters: TReportFilter[], entity: TReportEntity, combinator: TReportCombinator): Record<string, TWhereClause> => {
  if (combinator !== 'and') return {}

  const byPath = new Map<string, TWhereClause[]>()

  for (const part of filterParts(filters, entity)) {
    const segments = pathSegments(part.recordPath)

    for (let depth = 0; depth < part.predicates.length; depth += 1) {
      const path = buildPath(...segments.slice(0, depth + 1))
      const clause = negate(withinEdges(part.clause, part.predicates.slice(depth + 1)), part.negated)
      byPath.set(path, [...(byPath.get(path) ?? []), clause])
    }
  }

  return Object.fromEntries(
    [...byPath.entries()].flatMap(([path, clauses]) => {
      const combined = combineClauses('and', clauses)

      return combined ? [[path, combined]] : []
    }),
  )
}

import { REPORT_OPERATOR_SUFFIX, type TReportField, type TReportFieldKind, type TReportOperator } from '@repo/codegen/src/report-schema.generated'

export type TReportCombinator = 'and' | 'or'

export type TReportFilter = {
  id: string
  field: string
  operator: TReportOperator
  value: string
}

export const MAX_FILTERS = 5

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

export const operatorLabel = (operator: TReportOperator, kind: TReportFieldKind): string =>
  kind === 'time' ? (TIME_OPERATOR_LABELS[operator] ?? OPERATOR_LABELS[operator]) : OPERATOR_LABELS[operator]

export type TFilterValueInput = 'none' | 'enumList' | 'list' | 'enum' | 'boolean' | 'number' | 'date' | 'text'

export const filterValueInput = (field: TReportField, operator: TReportOperator): TFilterValueInput => {
  if (operator === 'isNil' || operator === 'notNil') return 'none'
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

export const isFilterComplete = (filter: TReportFilter, field: TReportField | undefined): boolean => {
  if (!field) return false

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

const dayClause = (filter: TReportFilter): Record<string, unknown> | null => {
  const start = toUtcInstant(filter.value.trim())
  if (!start) return null

  const startOfDay = toStorageTime(start)
  const startOfNextDay = toStorageTime(new Date(start.getTime() + MS_PER_DAY))

  if (filter.operator === 'eq') return { [`${filter.field}GTE`]: startOfDay, [`${filter.field}LT`]: startOfNextDay }
  if (filter.operator === 'gt') return { [`${filter.field}GTE`]: startOfNextDay }
  if (filter.operator === 'lte') return { [`${filter.field}LT`]: startOfNextDay }

  return null
}

const DAY_BOUNDED_OPERATORS: TReportOperator[] = ['eq', 'gt', 'lte']

const filterClause = (filter: TReportFilter, field: TReportField): Record<string, unknown> | null => {
  if (isDateOnly(filter, field) && DAY_BOUNDED_OPERATORS.includes(filter.operator)) return dayClause(filter)

  const value = coerceValue(filter, field)

  return value === null ? null : { [`${filter.field}${REPORT_OPERATOR_SUFFIX[filter.operator]}`]: value }
}

export const buildWhere = (filters: TReportFilter[], fields: TReportField[], combinator: TReportCombinator): Record<string, unknown> | null => {
  const fieldsByName = new Map(fields.map((field) => [field.name, field]))

  const clauses = filters
    .map((filter) => {
      const field = fieldsByName.get(filter.field)

      return field && isFilterComplete(filter, field) ? filterClause(filter, field) : null
    })
    .filter((clause): clause is Record<string, unknown> => clause !== null)

  if (clauses.length === 0) return null
  if (clauses.length === 1) return clauses[0]

  return combinator === 'or' ? { or: clauses } : { and: clauses }
}

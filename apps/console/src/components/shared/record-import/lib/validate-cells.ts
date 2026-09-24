import type { ImportFieldMeta } from '@repo/codegen/src/import-fields.generated'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatList } from '@/utils/strings'
import { isUlid } from '@/lib/validators'
import type { TDestinationField, TValueMap } from './types'

export const MAX_MAPPABLE_VALUES = 50

export type TInvalidValue = {
  value: string
  rowIndexes: number[]
  suggestion?: string
}

export type TColumnCellCheck = {
  expected: string
  invalidValues: TInvalidValue[]
  mappableValues?: readonly string[]
  tooManyToMap?: boolean
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const RFC3339 = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/
const INTEGER = /^[+-]?(0|[1-9]\d*)$/
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/
const GO_BOOLEANS = new Set(['1', 't', 'T', 'TRUE', 'true', 'True', '0', 'f', 'F', 'FALSE', 'false', 'False'])
const YES_NO = /^(yes|no)$/i
const LIST_DELIMITERS = [';', '|', ',']
const MIN_SUGGESTION_LENGTH = 3
const MAX_HOUR = 23
const MAX_MINUTE = 59

export const toEnumToken = (value: string): string =>
  value
    .trim()
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z0-9])|([a-zA-Z])([0-9])|([0-9])([a-zA-Z])/g, (_match, a, b, c, d, e, f) => `${a ?? c ?? e} ${b ?? d ?? f}`)
    .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .join('_')
    .toUpperCase()

const isValidCalendarDate = (value: string): boolean => {
  const dateOnly = DATE_ONLY.exec(value)
  if (!dateOnly) return false
  const [, year, month, day] = dateOnly.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const isValidTimestamp = (value: string): boolean => {
  const match = RFC3339.exec(value)
  if (!match) return false
  const [, date, hour, minute, second, , , offsetHour, offsetMinute] = match
  const withinRange = [hour, offsetHour ?? '0'].every((part) => Number(part) <= MAX_HOUR) && [minute, second, offsetMinute ?? '0'].every((part) => Number(part) <= MAX_MINUTE)
  return withinRange && isValidCalendarDate(date)
}

const isValidDate = (value: string): boolean => isValidCalendarDate(value) || isValidTimestamp(value)

const NOT_JSON = Symbol('not-json')

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return NOT_JSON
  }
}

const isValidJson = (value: string): boolean => parseJson(value) !== NOT_JSON

const splitListCell = (cell: string): string[] | null => {
  const decoded = parseJson(cell)
  if (decoded !== NOT_JSON) {
    if (Array.isArray(decoded)) return decoded.map(String)
    if (decoded === null) return []
    if (typeof decoded === 'object') return null
    return [String(decoded)]
  }

  const delimiter = LIST_DELIMITERS.find((candidate) => cell.includes(candidate))
  return (delimiter ? cell.split(delimiter) : [cell]).map((item) => item.trim()).filter(Boolean)
}

type TItemRule = { expected: string; isValid: (value: string) => boolean }

const itemRule = (meta: ImportFieldMeta): TItemRule | null => {
  switch (meta.kind) {
    case 'id':
      return { expected: 'an Openlane ID (a 26-character ULID)', isValid: isUlid }
    case 'date':
      return meta.timestamp ? { expected: 'a timestamp like 2026-02-07T16:09:36Z', isValid: isValidTimestamp } : { expected: 'a date like 2026-02-07 or 2026-02-07T16:09:36Z', isValid: isValidDate }
    case 'boolean':
      return { expected: 'true, false, yes or no', isValid: (value) => GO_BOOLEANS.has(value) || YES_NO.test(value) }
    case 'number':
      return meta.integer ? { expected: 'a whole number', isValid: (value) => INTEGER.test(value) } : { expected: 'a number', isValid: (value) => DECIMAL.test(value.replaceAll(',', '.')) }
    case 'enum': {
      const tokens = new Set((meta.enumValues ?? []).map(toEnumToken))
      return { expected: `one of ${formatList((meta.enumValues ?? []).map(getEnumLabel), 'disjunction')}`, isValid: (value) => tokens.has(toEnumToken(value)) }
    }
    case 'json':
    case 'object':
      return meta.list ? null : { expected: 'valid JSON', isValid: isValidJson }
    default:
      return null
  }
}

const suggestEnumValue = (value: string, enumValues: readonly string[]): string | undefined => {
  const token = toEnumToken(value)
  if (token.length < MIN_SUGGESTION_LENGTH) return undefined
  const candidates = enumValues.filter((candidate) => toEnumToken(candidate).startsWith(token))
  return candidates.length === 1 ? candidates[0] : undefined
}

const checkCells = (rows: string[][], columnIndex: number, meta: ImportFieldMeta): TColumnCellCheck | null => {
  const rule = itemRule(meta)
  if (!rule) return null

  const isValidCell = (cell: string) => (meta.list ? splitListCell(cell) : [cell])?.every(rule.isValid) ?? false
  const blankIsInvalid = meta.timestamp === true && !meta.list
  const validity = new Map<string, boolean>()
  const invalid = new Map<string, number[]>()
  rows.forEach((row, rowIndex) => {
    const cell = row[columnIndex]?.trim() ?? ''
    if (!cell && !blankIsInvalid) return
    const isValid = cell !== '' && (validity.get(cell) ?? isValidCell(cell))
    validity.set(cell, isValid)
    if (isValid) return
    const rowIndexes = invalid.get(cell)
    if (rowIndexes) rowIndexes.push(rowIndex)
    else invalid.set(cell, [rowIndex])
  })

  if (invalid.size === 0) return null

  const isEnumColumn = meta.kind === 'enum' && !meta.list
  const mappableValues = isEnumColumn && invalid.size <= MAX_MAPPABLE_VALUES ? meta.enumValues : undefined
  return {
    expected: meta.list ? `${rule.expected} for every item in the list` : rule.expected,
    invalidValues: [...invalid].map(([value, rowIndexes]) => ({ value, rowIndexes, suggestion: mappableValues ? suggestEnumValue(value, mappableValues) : undefined })),
    mappableValues,
    tooManyToMap: isEnumColumn && !mappableValues,
  }
}

const checkCache = new WeakMap<string[][], Map<string, TColumnCellCheck | null>>()

export const checkColumnCells = (rows: string[][], columnIndex: number, field: TDestinationField | undefined): TColumnCellCheck | null => {
  if (!field?.meta) return null

  const byColumn = checkCache.get(rows) ?? new Map<string, TColumnCellCheck | null>()
  checkCache.set(rows, byColumn)

  const key = `${columnIndex}:${field.name}`
  const cached = byColumn.get(key)
  if (cached !== undefined) return cached

  const result = checkCells(rows, columnIndex, field.meta)
  byColumn.set(key, result)
  return result
}

export const suggestedValueMap = (check: TColumnCellCheck | null): TValueMap =>
  Object.fromEntries((check?.invalidValues ?? []).flatMap(({ value, suggestion }) => (suggestion ? [[value, suggestion]] : [])))

export const unresolvedValues = (check: TColumnCellCheck | null, valueMap: TValueMap | undefined): TInvalidValue[] =>
  (check?.invalidValues ?? []).filter(({ value }) => !(check?.mappableValues && valueMap && Object.hasOwn(valueMap, value)))

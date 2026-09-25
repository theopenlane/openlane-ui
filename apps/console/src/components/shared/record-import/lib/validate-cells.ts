import type { ImportFieldMeta } from '@repo/codegen/src/import-fields.generated'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatList } from '@/utils/strings'
import { isUlid } from '@/lib/validators'
import { inferDateOrder, isAmbiguousDate, isCanonicalDate, normalizeLooseDate, type TDateOrder } from '@/utils/loose-date'
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
  conversions: Readonly<Record<string, string>>
  convertedRowCount: number
  dateOrder?: TDateOrder
  mappableValues?: readonly string[]
  tooManyToMap?: boolean
}

const INTEGER = /^[+-]?(0|[1-9]\d*)$/
const DECIMAL = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/
const GO_BOOLEANS = new Set(['1', 't', 'T', 'TRUE', 'true', 'True', '0', 'f', 'F', 'FALSE', 'false', 'False'])
const YES_NO = /^(yes|no)$/i
const LIST_DELIMITERS = [';', '|', ',']
const MIN_SUGGESTION_LENGTH = 3

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

type TItemRule = { expected: string; isValid: (value: string) => boolean; normalize?: (value: string) => string | null }

const dateRule = (meta: ImportFieldMeta, order: TDateOrder): TItemRule => {
  const timestamp = meta.timestamp === true
  const referenceYear = new Date().getFullYear()
  const isValid = (value: string) => isCanonicalDate(value, timestamp)
  if (meta.list) return { expected: timestamp ? 'a timestamp like 2026-02-07T16:09:36Z' : 'a date like 2026-02-07 or 2026-02-07T16:09:36Z', isValid }
  return {
    expected: timestamp ? 'a date or time like 2026-02-07T16:09:36Z, 2/7/2026 4:09 PM or Feb 7, 2026' : 'a date like 2026-02-07, 2/7/2026 or Feb 7, 2026',
    isValid,
    normalize: (value) => normalizeLooseDate(value, { order, timestamp, referenceYear }),
  }
}

const itemRule = (meta: ImportFieldMeta): TItemRule | null => {
  switch (meta.kind) {
    case 'id':
      return { expected: 'an Openlane ID (a 26-character ULID)', isValid: isUlid }
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

const checkCells = (rows: string[][], columnIndex: number, meta: ImportFieldMeta, dateOrder: TDateOrder | undefined): TColumnCellCheck | null => {
  const distinctDates = meta.kind === 'date' ? new Set(rows.map((row) => row[columnIndex]?.trim() ?? '')) : undefined
  const order = distinctDates ? (dateOrder ?? inferDateOrder(distinctDates)) : undefined
  const rule = order ? dateRule(meta, order) : itemRule(meta)
  if (!rule) return null

  const resolveCell = (cell: string): string | null => {
    if (rule.normalize) return rule.normalize(cell)
    return (meta.list ? splitListCell(cell) : [cell])?.every(rule.isValid) ? cell : null
  }
  const blankIsInvalid = meta.timestamp === true && !meta.list
  const resolved = new Map<string, string | null>()
  const invalid = new Map<string, number[]>()
  const conversions = new Map<string, string>()
  let convertedRowCount = 0
  rows.forEach((row, rowIndex) => {
    const cell = row[columnIndex]?.trim() ?? ''
    if (!cell && !blankIsInvalid) return
    let canonical = resolved.get(cell)
    if (canonical === undefined) {
      canonical = cell ? resolveCell(cell) : null
      resolved.set(cell, canonical)
    }
    if (canonical !== null) {
      if (canonical !== cell) {
        conversions.set(cell, canonical)
        convertedRowCount++
      }
      return
    }
    const rowIndexes = invalid.get(cell)
    if (rowIndexes) rowIndexes.push(rowIndex)
    else invalid.set(cell, [rowIndex])
  })

  if (invalid.size === 0 && conversions.size === 0) return null

  const isEnumColumn = meta.kind === 'enum' && !meta.list
  const mappableValues = isEnumColumn && invalid.size <= MAX_MAPPABLE_VALUES ? meta.enumValues : undefined
  return {
    expected: meta.list ? `${rule.expected} for every item in the list` : rule.expected,
    invalidValues: [...invalid].map(([value, rowIndexes]) => ({ value, rowIndexes, suggestion: mappableValues ? suggestEnumValue(value, mappableValues) : undefined })),
    conversions: Object.fromEntries(conversions),
    convertedRowCount,
    dateOrder: rule.normalize && distinctDates && [...distinctDates].some(isAmbiguousDate) ? order : undefined,
    mappableValues,
    tooManyToMap: isEnumColumn && !mappableValues,
  }
}

const checkCache = new WeakMap<string[][], Map<string, TColumnCellCheck | null>>()

export const checkColumnCells = (rows: string[][], columnIndex: number, field: TDestinationField | undefined, dateOrder?: TDateOrder): TColumnCellCheck | null => {
  if (!field?.meta) return null

  const byColumn = checkCache.get(rows) ?? new Map<string, TColumnCellCheck | null>()
  checkCache.set(rows, byColumn)

  const key = `${columnIndex}:${field.name}:${dateOrder ?? ''}`
  const cached = byColumn.get(key)
  if (cached !== undefined) return cached

  const result = checkCells(rows, columnIndex, field.meta, dateOrder)
  byColumn.set(key, result)
  return result
}

export const suggestedValueMap = (check: TColumnCellCheck | null): TValueMap =>
  Object.fromEntries((check?.invalidValues ?? []).flatMap(({ value, suggestion }) => (suggestion ? [[value, suggestion]] : [])))

export const unresolvedValues = (check: TColumnCellCheck | null, valueMap: TValueMap | undefined): TInvalidValue[] =>
  (check?.invalidValues ?? []).filter(({ value }) => !(check?.mappableValues && valueMap && Object.hasOwn(valueMap, value)))

import { normalizeFieldName } from '@/utils/strings'
import { htmlToInlineText } from '@/lib/html/html-to-text'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { parseBooleanCell, splitListCell } from './validate-cells'
import { byNormalizedName, UPDATE_ID_FIELD } from './destination-fields'
import type { TImportPlan } from './build-mapped-import'
import type { TDestinationField } from './types'

type TRecordFieldValue = string | number | boolean | readonly string[] | null | undefined

export type TExistingRecord = {
  id: string
  label: string
  values: Readonly<Record<string, TRecordFieldValue>>
}

export type TUpdateLookupKeys = { ids: string[]; lookups: string[] }

type TUpdateLookupResult = { byId: TExistingRecord[]; byLookup: TExistingRecord[] }

export type TUpdateRecordSource = {
  queryKey: readonly string[]
  fetchRecords: (keys: TUpdateLookupKeys) => Promise<TUpdateLookupResult>
}

export type TFieldChange = {
  label: string
  current?: string
  next: string
  formattingOnly?: boolean
}

export type TMatchedRow = { rowIndex: number; record: TExistingRecord; matchedBy: 'id' | 'lookup'; lookupValue: string; changes: TFieldChange[] }

export type TSkippedRow = { rowIndex: number; key: string; reason: 'missing' | 'ambiguous' }

export type TUpdatePreview = {
  matched: TMatchedRow[]
  changed: TMatchedRow[]
  skipped: TSkippedRow[]
  duplicateRowIndexes: number[]
}

const isBlank = (value: TRecordFieldValue): boolean => value === null || value === undefined || (Array.isArray(value) ? value.length === 0 : String(value).trim() === '')

const rawValue = (value: TRecordFieldValue): string => {
  if (isBlank(value)) return ''
  return Array.isArray(value) ? value.join(', ') : String(value).trim()
}

const displayValue = (value: string): string => htmlToInlineText(value)

const sameList = (current: readonly string[], cell: string): boolean => {
  const next = splitListCell(cell)
  if (!next) return false
  const normalize = (items: readonly string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))].sort()
  const [a, b] = [normalize(current), normalize(next)]
  return a.length === b.length && a.every((item, index) => item === b[index])
}

const isUnchanged = (current: TRecordFieldValue, cell: string): boolean => {
  if (isBlank(current) || cell === '') return isBlank(current) && cell === ''
  if (Array.isArray(current)) return sameList(current, cell)
  if (typeof current === 'boolean') return current === parseBooleanCell(cell)
  return rawValue(current) === cell
}

const keepsValueWhenBlank = (field: TDestinationField | undefined): boolean => field?.meta?.list === true || field?.meta?.kind === 'enum' || field?.meta?.kind === 'boolean'

const headerPosition = (plan: TImportPlan, name: string | undefined): number => {
  const normalized = name === undefined ? undefined : normalizeFieldName(name)
  return normalized === undefined ? -1 : plan.headers.findIndex((header) => normalizeFieldName(header) === normalized)
}

export type TRowKeyReader = (built: string[]) => { id?: string; lookup?: string }

export const buildRowKeyReader = (plan: TImportPlan, lookupField: TDestinationField | undefined): TRowKeyReader => {
  const idPosition = headerPosition(plan, UPDATE_ID_FIELD.name)
  const lookupPosition = headerPosition(plan, lookupField?.name)
  return (built) => ({ id: built[idPosition]?.trim().toUpperCase() || undefined, lookup: built[lookupPosition]?.trim() || undefined })
}

export const collectLookupKeys = (builtRows: string[][], readKeys: TRowKeyReader): TUpdateLookupKeys => {
  const ids = new Set<string>()
  const lookups = new Set<string>()
  builtRows.forEach((built) => {
    const { id, lookup } = readKeys(built)
    if (id) ids.add(id)
    else if (lookup) lookups.add(lookup)
  })
  return { ids: [...ids].sort(), lookups: [...lookups].sort() }
}

const recordKeysOf = (records: TExistingRecord[]) => byNormalizedName(Object.keys(records[0]?.values ?? {}).map((key) => [key, key]))

const comparedColumns = (plan: TImportPlan, recordKeyByName: ReadonlyMap<string, string>, fields: readonly TDestinationField[], lookupField: TDestinationField | undefined) => {
  const lookupName = lookupField && normalizeFieldName(lookupField.name)
  const idName = normalizeFieldName(UPDATE_ID_FIELD.name)
  const fieldByName = byNormalizedName(fields.map((field) => [field.name, field]))
  return plan.headers.flatMap((header, position) => {
    const name = normalizeFieldName(header)
    if (name === idName) return []
    const field = fieldByName.get(name)
    const isEnum = field?.meta?.kind === 'enum' && !field.meta.list
    return [
      {
        position,
        label: plan.labels[position] ?? header,
        recordKey: recordKeyByName.get(name),
        keepsWhenBlank: name === lookupName || keepsValueWhenBlank(field),
        display: isEnum ? getEnumLabel : displayValue,
      },
    ]
  })
}

export const buildUpdatePreview = ({
  builtRows,
  readKeys,
  result,
  plan,
  fields,
  lookupField,
}: {
  builtRows: string[][]
  readKeys: TRowKeyReader
  result: TUpdateLookupResult
  plan: TImportPlan
  fields: readonly TDestinationField[]
  lookupField: TDestinationField | undefined
}): TUpdatePreview => {
  const recordKeyByName = recordKeysOf([...result.byId, ...result.byLookup])
  const columns = comparedColumns(plan, recordKeyByName, fields, lookupField)
  const lookupKey = lookupField && recordKeyByName.get(normalizeFieldName(lookupField.name))
  const byId = new Map(result.byId.map((record) => [record.id.toUpperCase(), record]))
  const byLookup = new Map<string, TExistingRecord[]>()
  result.byLookup.forEach((record) => {
    const key = lookupKey ? rawValue(record.values[lookupKey]) : ''
    if (key) byLookup.set(key, [...(byLookup.get(key) ?? []), record])
  })

  const diffRow = (record: TExistingRecord, built: string[]): TFieldChange[] =>
    columns.flatMap(({ position, label, recordKey, keepsWhenBlank, display }): TFieldChange[] => {
      const next = built[position]?.trim() ?? ''
      if (next === '' && keepsWhenBlank) return []
      if (recordKey === undefined) return [{ label, next: next && display(next) }]
      const current = record.values[recordKey]
      if (isUnchanged(current, next)) return []
      const currentRaw = rawValue(current)
      const [currentText, nextText] = [currentRaw && display(currentRaw), next && display(next)]
      return [{ label, current: currentText, next: nextText, formattingOnly: currentText === nextText }]
    })

  const preview: TUpdatePreview = { matched: [], changed: [], skipped: [], duplicateRowIndexes: [] }
  const seenRecords = new Set<string>()
  builtRows.forEach((built, rowIndex) => {
    const { id, lookup } = readKeys(built)
    const key = id ?? lookup ?? ''
    const candidates = id ? [byId.get(id)].filter((record) => record !== undefined) : (byLookup.get(key) ?? [])
    if (candidates.length !== 1) {
      preview.skipped.push({ rowIndex, key, reason: candidates.length === 0 ? 'missing' : 'ambiguous' })
      return
    }

    const [record] = candidates
    if (seenRecords.has(record.id)) {
      preview.duplicateRowIndexes.push(rowIndex)
      return
    }
    seenRecords.add(record.id)

    const row: TMatchedRow = { rowIndex, record, matchedBy: id ? 'id' : 'lookup', lookupValue: lookupKey ? rawValue(record.values[lookupKey]) : '', changes: diffRow(record, built) }
    preview.matched.push(row)
    if (row.changes.length > 0) preview.changed.push(row)
  })

  return preview
}

export const toResolvedImport = (plan: TImportPlan, builtRows: string[][], matched: TMatchedRow[], lookupField: TDestinationField | undefined): { plan: TImportPlan; rows: string[][] } => {
  const idPosition = headerPosition(plan, UPDATE_ID_FIELD.name)
  const lookupPosition = headerPosition(plan, lookupField?.name)
  const rows = matched.map(({ rowIndex, record, lookupValue }) => {
    const built = builtRows[rowIndex].map((cell, position) => (position === lookupPosition && !cell.trim() ? lookupValue : cell))
    return idPosition >= 0 ? built.map((cell, position) => (position === idPosition ? record.id : cell)) : [record.id, ...built]
  })
  const identity = (row: string[]) => row

  return {
    plan: idPosition >= 0 ? { ...plan, buildRow: identity } : { ...plan, headers: [UPDATE_ID_FIELD.name, ...plan.headers], labels: [UPDATE_ID_FIELD.label, ...plan.labels], buildRow: identity },
    rows,
  }
}

import type { MergeFieldConfig, MergeFieldOverrides, MergeFieldType } from './types'

const humanizeKey = (input: string): string => {
  if (!input) return ''
  const spaced = input
    .replace(/[_-]+/g, ' ')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  const words = spaced.split(' ')
  return words
    .map((word, index) => {
      if (word.length > 1 && word === word.toUpperCase()) return word
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      return word.toLowerCase()
    })
    .join(' ')
}

export const DEFAULT_MERGE_EXCLUDED_KEYS: ReadonlySet<string> = new Set([
  '__typename',
  'id',
  'displayID',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  'deletedAt',
  'deletedBy',
  'ownerID',
  'ownerName',
  'environmentID',
  'environmentName',
  'scopeID',
  'scopeName',
  'systemInternalID',
  'systemOwned',
  'isOpenlaneUser',
])

const DATE_KEY_PATTERN = /(?:Date|At)$/

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const isEdgeOrConnection = (value: unknown): boolean => {
  if (!isPlainObject(value)) return false
  if ('edges' in value) return true
  if ('pageInfo' in value && 'totalCount' in value) return true
  return false
}

const isMergeableValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return true
  if (typeof value === 'number') return true
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.every((item) => typeof item === 'string')
  if (isPlainObject(value)) return !isEdgeOrConnection(value)
  return false
}

const inferType = (key: string, value: unknown): MergeFieldType => {
  if (Array.isArray(value)) return 'tags'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (isPlainObject(value)) return 'map'
  if (DATE_KEY_PATTERN.test(key)) return 'date'
  return 'text'
}

export const buildMergeFields = <T extends object>(sample: T, overrides: MergeFieldOverrides<T> = {}, excludeExtra: ReadonlyArray<Extract<keyof T, string>> = []): MergeFieldConfig<T>[] => {
  const exclude = new Set<string>([...DEFAULT_MERGE_EXCLUDED_KEYS, ...excludeExtra])
  const sampleRecord = sample as Record<string, unknown>
  const overrideKeys = new Set(Object.keys(overrides))
  const seen = new Set<string>()
  const fields: MergeFieldConfig<T>[] = []

  const addField = (key: Extract<keyof T, string>) => {
    if (seen.has(key)) return
    seen.add(key)
    const override = overrides[key]
    if (override) {
      fields.push({ key, ...override })
      return
    }
    const value = sampleRecord[key]
    if (!isMergeableValue(value)) return
    fields.push({ key, label: humanizeKey(key), type: inferType(key, value) })
  }

  for (const key of Object.keys(sample) as Array<Extract<keyof T, string>>) {
    if (exclude.has(key)) continue
    if (!overrideKeys.has(key) && !isMergeableValue(sampleRecord[key])) continue
    addField(key)
  }

  for (const key of overrideKeys as Set<Extract<keyof T, string>>) {
    if (exclude.has(key)) continue
    addField(key)
  }

  return fields
}

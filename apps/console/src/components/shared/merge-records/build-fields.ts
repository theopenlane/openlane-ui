import type { MergeFieldDescriptor } from '@repo/codegen/src/merge-fields.generated'
import type { MergeFieldConfig, MergeFieldOverride, MergeFieldOverrides, MergeFieldType } from './types'

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
  'externalID',
  'internalNotes',
  'observedAt',
])

const DATE_KEY_PATTERN = /(?:Date|At)$/

const SCALAR_TYPE_INFERENCE: Readonly<Record<string, MergeFieldType>> = {
  Boolean: 'boolean',
  Int: 'number',
  Float: 'number',
  Map: 'map',
  JSON: 'map',
  DateTime: 'date',
  Date: 'date',
  Time: 'date',
}

const inferTypeFromDescriptor = (descriptor: MergeFieldDescriptor): MergeFieldType => {
  if (descriptor.list) return 'tags'
  if (descriptor.enumName) return 'enum'
  if (descriptor.scalarName) {
    const mapped = SCALAR_TYPE_INFERENCE[descriptor.scalarName]
    if (mapped) return mapped
  }
  return 'text'
}

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

const inferTypeFromValue = (key: string, value: unknown): MergeFieldType => {
  if (Array.isArray(value)) return 'tags'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (isPlainObject(value)) return 'map'
  if (DATE_KEY_PATTERN.test(key)) return 'date'
  return 'text'
}

export const buildMergeFields = <T extends object>(
  sample: T,
  overrides: MergeFieldOverrides<T> = {},
  excludeExtra: ReadonlyArray<Extract<keyof T, string>> = [],
  schemaDescriptors?: readonly MergeFieldDescriptor[],
  schemaExcludeExtra: ReadonlyArray<string> = [],
): MergeFieldConfig<T>[] => {
  const exclude = new Set<string>([...DEFAULT_MERGE_EXCLUDED_KEYS, ...excludeExtra, ...schemaExcludeExtra])
  const sampleRecord = sample as Record<string, unknown>
  const overrideMap = overrides as Record<string, MergeFieldOverride<T> | undefined>
  const overrideKeys = Object.keys(overrides)
  const seen = new Set<string>()
  const fields: MergeFieldConfig<T>[] = []

  const addField = (key: string, descriptor?: MergeFieldDescriptor) => {
    if (seen.has(key)) return
    seen.add(key)
    const override = overrideMap[key]
    if (override) {
      fields.push({ key: key as Extract<keyof T, string>, ...override })
      return
    }
    if (descriptor) {
      fields.push({ key: key as Extract<keyof T, string>, label: humanizeKey(key), type: inferTypeFromDescriptor(descriptor) })
      return
    }
    const value = sampleRecord[key]
    if (!isMergeableValue(value)) return
    fields.push({ key: key as Extract<keyof T, string>, label: humanizeKey(key), type: inferTypeFromValue(key, value) })
  }

  if (schemaDescriptors) {
    const missingFromRecord: string[] = []
    const schemaNames = new Set(schemaDescriptors.map((d) => d.name))
    for (const descriptor of schemaDescriptors) {
      if (exclude.has(descriptor.name)) continue
      if (!(descriptor.name in sampleRecord)) {
        if (!overrideMap[descriptor.name]) missingFromRecord.push(descriptor.name)
        continue
      }
      addField(descriptor.name, descriptor)
    }
    if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
      if (missingFromRecord.length > 0) {
        console.warn(
          `[merge-records] GraphQL fetch query is missing schema-declared fields: ${missingFromRecord.join(', ')}. ` +
            'Add them to the corresponding query in packages/codegen/query/ so they can be reconciled during merge.',
        )
      }
      const orphanSchemaExcludes = schemaExcludeExtra.filter((name) => !schemaNames.has(name))
      if (orphanSchemaExcludes.length > 0) {
        console.warn(
          `[merge-records] schemaExcludeFields contains names not in the GraphQL schema for this type: ${orphanSchemaExcludes.join(', ')}. ` +
            'Either the schema changed and the exclude is no longer needed, or the entry is a typo.',
        )
      }
    }
  } else {
    for (const key of Object.keys(sampleRecord) as Array<Extract<keyof T, string>>) {
      if (exclude.has(key)) continue
      if (!overrideMap[key] && !isMergeableValue(sampleRecord[key])) continue
      addField(key)
    }
  }

  for (const key of overrideKeys) {
    if (exclude.has(key)) continue
    if (seen.has(key)) continue
    addField(key)
  }

  return fields
}

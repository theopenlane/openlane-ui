import { normalizeFieldName, toHumanLabel } from '@/utils/strings'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import type { ImportFieldKind, ImportFieldMeta } from '@repo/codegen/src/import-fields.generated'
import { parseDelimitedText, serializeCsv } from './delimited-file'
import { getImportEntityConfig } from './import-registry'
import type { TDestinationField, TDestinationFieldSet, TImportDestination } from './types'

export type TImportFieldMetadata = Readonly<Record<string, ImportFieldMeta>>

const FUZZY_MATCHABLE_KINDS: ReadonlySet<ImportFieldKind> = new Set(['string', 'number', 'boolean', 'date', 'enum'])
const PRIMARY_FIELD_FALLBACKS = ['name', 'title']

export const buildDestinationFields = (entityType: ObjectTypes, sampleCsv: string, metadata: TImportFieldMetadata = {}): TDestinationFieldSet => {
  const sample = parseDelimitedText(sampleCsv, { previewRows: 1 })
  const { requiredFields, requiredOneOf, primaryField, autoValues, uniqueFields } = getImportEntityConfig(entityType)
  const requiredGroupNames = [...requiredFields.map((field) => [field]), ...requiredOneOf]
  const requirementByName = new Map(requiredGroupNames.flatMap((group) => group.map((field) => [normalizeFieldName(field), group.length === 1 ? 'required' : 'oneOf'] as const)))
  const autoValueByName = new Map(Object.entries(autoValues).map(([field, value]) => [normalizeFieldName(field), value]))
  const metadataByName = new Map(Object.entries(metadata).map(([field, meta]) => [normalizeFieldName(field), meta]))
  const exampleRow = sample?.rows[0] ?? []
  const exampleByName = new Map((sample?.headers ?? []).map((header, index) => [normalizeFieldName(header), exampleRow[index]?.trim() || undefined]))

  const toField = (name: string): TDestinationField => {
    const normalized = normalizeFieldName(name)
    const meta = metadataByName.get(normalized)

    return {
      name,
      label: toHumanLabel(name),
      requirement: requirementByName.get(normalized),
      autoValue: autoValueByName.get(normalized),
      description: meta?.description,
      example: exampleByName.get(normalized),
      fuzzyMatchable: Boolean(meta && !meta.list && FUZZY_MATCHABLE_KINDS.has(meta.kind)),
      meta,
    }
  }

  const isAdminOnly = (name: string) => metadataByName.get(normalizeFieldName(name))?.adminOnly === true
  const declared = (sample?.headers ?? []).filter((header) => !isAdminOnly(header)).map(toField)
  const declaredNames = new Set(declared.map((field) => normalizeFieldName(field.name)))
  const undeclared = [...requiredGroupNames.flat(), ...Object.keys(autoValues)]
    .filter((field, index, all) => all.indexOf(field) === index && !declaredNames.has(normalizeFieldName(field)))
    .map(toField)

  const fields = [...undeclared, ...declared].sort((a, b) => Number(Boolean(b.requirement)) - Number(Boolean(a.requirement)))
  const fieldByName = new Map(fields.map((field) => [normalizeFieldName(field.name), field]))
  const resolve = (name: string | undefined) => (name === undefined ? undefined : fieldByName.get(normalizeFieldName(name)))
  const resolveAll = (names: string[]) => names.map(resolve).filter((field): field is TDestinationField => field !== undefined)

  return {
    fields,
    fixedFields: [],
    requiredGroups: requiredGroupNames.map(resolveAll).filter((group) => group.length > 0),
    uniqueFields: resolveAll(uniqueFields),
    primaryField: [primaryField, ...PRIMARY_FIELD_FALLBACKS].map(resolve).find((field) => field !== undefined)?.name,
  }
}

export const getRegistryFixedFields = (entityType: ObjectTypes): TDestinationField[] =>
  Object.entries(getImportEntityConfig(entityType).fixedValues).map(([name, value]) => ({
    name,
    label: toHumanLabel(name),
    autoValue: String(value),
    autoValueLabel: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : undefined,
    fuzzyMatchable: false,
  }))

export const withFixedFields = (fieldSet: TDestinationFieldSet, fixedFields: readonly TDestinationField[]): TDestinationFieldSet => {
  const alreadyFixed = new Set(fieldSet.fixedFields.map(({ name }) => normalizeFieldName(name)))
  const added = fixedFields.filter((field, index) => {
    const key = normalizeFieldName(field.name)
    return !alreadyFixed.has(key) && fixedFields.findIndex((other) => normalizeFieldName(other.name) === key) === index
  })
  if (added.length === 0) return fieldSet

  const fixedNames = new Set(added.map(({ name }) => normalizeFieldName(name)))
  const isMappable = (field: TDestinationField) => !fixedNames.has(normalizeFieldName(field.name))

  return {
    fields: fieldSet.fields.filter(isMappable),
    fixedFields: [...fieldSet.fixedFields, ...added],
    requiredGroups: fieldSet.requiredGroups.filter((group) => group.every(isMappable)),
    uniqueFields: fieldSet.uniqueFields.filter(isMappable),
    primaryField: fieldSet.primaryField !== undefined && fixedNames.has(normalizeFieldName(fieldSet.primaryField)) ? undefined : fieldSet.primaryField,
  }
}

export type TStaticFieldSet = Omit<TDestinationFieldSet, 'fixedFields' | 'uniqueFields' | 'requiredGroups'> & Partial<Pick<TDestinationFieldSet, 'uniqueFields'>>

const requiredGroupsOf = (fields: TDestinationField[]): TDestinationField[][] => {
  const anyOf = fields.filter((field) => field.requirement === 'oneOf')
  return [...fields.filter((field) => field.requirement === 'required').map((field) => [field]), ...(anyOf.length > 0 ? [anyOf] : [])]
}

export const staticImportDestination = (fieldSet: TStaticFieldSet, exampleFilename: string): TImportDestination => ({
  fieldSet: { fixedFields: [], uniqueFields: [], requiredGroups: requiredGroupsOf(fieldSet.fields), ...fieldSet },
  exampleCsv: serializeCsv(
    fieldSet.fields.map((field) => field.name),
    [fieldSet.fields.map((field) => field.example ?? '')],
  ),
  exampleFilename,
})

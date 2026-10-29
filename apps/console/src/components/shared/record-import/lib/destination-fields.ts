import { normalizeFieldName, toHumanLabel } from '@/utils/strings'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import type { ImportFieldKind, ImportFieldMeta } from '@repo/codegen/src/import-fields.generated'
import { parseDelimitedText, serializeCsv } from './delimited-file'
import { getImportEntityConfig } from './import-registry'
import type { TDestinationField, TDestinationFieldSet, TImportDestination } from './types'

export type TImportFieldMetadata = Readonly<Record<string, ImportFieldMeta>>

const FUZZY_MATCHABLE_KINDS: ReadonlySet<ImportFieldKind> = new Set(['string', 'number', 'boolean', 'date', 'enum'])
const PRIMARY_FIELD_FALLBACKS = ['name', 'title']

export const UPDATE_ID_FIELD: TDestinationField = {
  name: 'ID',
  label: 'ID',
  requirement: 'required',
  description: 'ID of the existing record to update',
  fuzzyMatchable: false,
  meta: { kind: 'id' },
}

const byNormalizedName = <T>(entries: [string, T][]): Map<string, T> => new Map(entries.map(([name, value]) => [normalizeFieldName(name), value]))

const readSample = (sampleCsv: string) => {
  const sample = parseDelimitedText(sampleCsv, { previewRows: 1 })
  const headers = sample?.headers ?? []
  const exampleRow = sample?.rows[0] ?? []
  const exampleByName = byNormalizedName(headers.map((header, index) => [header, exampleRow[index]?.trim() || undefined]))
  return { headers, exampleByName }
}

const toDestinationField = (name: string, meta: ImportFieldMeta | undefined, example: string | undefined): TDestinationField => ({
  name,
  label: toHumanLabel(name),
  description: meta?.description,
  example,
  fuzzyMatchable: Boolean(meta && !meta.list && FUZZY_MATCHABLE_KINDS.has(meta.kind)),
  meta,
})

const fieldResolver = (fields: TDestinationField[]) => {
  const fieldByName = byNormalizedName(fields.map((field) => [field.name, field]))
  const resolve = (name: string | undefined) => (name === undefined ? undefined : fieldByName.get(normalizeFieldName(name)))
  const resolveAll = (names: string[]) => names.map(resolve).filter((field): field is TDestinationField => field !== undefined)
  const resolvePrimary = (primaryField: string | undefined) => [primaryField, ...PRIMARY_FIELD_FALLBACKS].map(resolve).find((field) => field !== undefined)?.name
  return { resolveAll, resolvePrimary }
}

export const buildDestinationFields = (entityType: ObjectTypes, sampleCsv: string, metadata: TImportFieldMetadata = {}): TDestinationFieldSet => {
  const { headers, exampleByName } = readSample(sampleCsv)
  const { requiredFields, requiredOneOf, primaryField, autoValues, uniqueFields } = getImportEntityConfig(entityType)
  const requiredGroupNames = [...requiredFields.map((field) => [field]), ...requiredOneOf]
  const requirementByName = new Map(requiredGroupNames.flatMap((group) => group.map((field) => [normalizeFieldName(field), group.length === 1 ? 'required' : 'oneOf'] as const)))
  const autoValueByName = byNormalizedName(Object.entries(autoValues))
  const metadataByName = byNormalizedName(Object.entries(metadata))

  const toField = (name: string): TDestinationField => {
    const normalized = normalizeFieldName(name)
    return {
      ...toDestinationField(name, metadataByName.get(normalized), exampleByName.get(normalized)),
      requirement: requirementByName.get(normalized),
      autoValue: autoValueByName.get(normalized),
    }
  }

  const isAdminOnly = (name: string) => metadataByName.get(normalizeFieldName(name))?.adminOnly === true
  const declared = headers.filter((header) => !isAdminOnly(header)).map(toField)
  const declaredNames = new Set(declared.map((field) => normalizeFieldName(field.name)))
  const undeclared = [...requiredGroupNames.flat(), ...Object.keys(autoValues)]
    .filter((field, index, all) => all.indexOf(field) === index && !declaredNames.has(normalizeFieldName(field)))
    .map(toField)

  const fields = [...undeclared, ...declared].sort((a, b) => Number(Boolean(b.requirement)) - Number(Boolean(a.requirement)))
  const { resolveAll, resolvePrimary } = fieldResolver(fields)

  return {
    fields,
    fixedFields: [],
    requiredGroups: requiredGroupNames.map(resolveAll).filter((group) => group.length > 0),
    uniqueFields: resolveAll(uniqueFields),
    primaryField: resolvePrimary(primaryField),
  }
}

type TUpdateDestinationArgs = {
  entityType: ObjectTypes
  sampleCsv: string
  sampleFilename: string
  createMetadata: TImportFieldMetadata
  updateMetadata: TImportFieldMetadata
}

export const buildUpdateDestination = ({ entityType, sampleCsv, sampleFilename, createMetadata, updateMetadata }: TUpdateDestinationArgs): TImportDestination => {
  const { headers, exampleByName } = readSample(sampleCsv)
  const createInputNames = new Set(Object.keys(createMetadata).map(normalizeFieldName))
  const updateMetadataByName = byNormalizedName(Object.entries(updateMetadata))
  const idName = normalizeFieldName(UPDATE_ID_FIELD.name)

  const isCsvReferenceColumn = (normalized: string) => normalized !== idName && !createInputNames.has(normalized) && !updateMetadataByName.has(normalized)

  const sampleFields = headers
    .filter((header) => {
      const normalized = normalizeFieldName(header)
      return updateMetadataByName.has(normalized) ? !updateMetadataByName.get(normalized)?.adminOnly : isCsvReferenceColumn(normalized)
    })
    .map((header) => {
      const normalized = normalizeFieldName(header)
      return toDestinationField(header, updateMetadataByName.get(normalized), exampleByName.get(normalized))
    })
  const sampleNames = new Set(sampleFields.map((field) => normalizeFieldName(field.name)))
  const updateOnlyFields = Object.entries(updateMetadata)
    .filter(([key, meta]) => !meta.adminOnly && !sampleNames.has(normalizeFieldName(key)))
    .map(([key, meta]) => toDestinationField(capitalizeFirstLetter(key), meta, undefined))

  const templateFields = [UPDATE_ID_FIELD, ...sampleFields]
  const fields = [...templateFields, ...updateOnlyFields]

  return {
    fieldSet: {
      fields,
      fixedFields: [],
      requiredGroups: [[UPDATE_ID_FIELD]],
      uniqueFields: [UPDATE_ID_FIELD],
      primaryField: fieldResolver(fields).resolvePrimary(getImportEntityConfig(entityType).primaryField),
    },
    exampleCsv: exampleCsvFor(templateFields),
    exampleFilename: `${sampleFilename}-update`,
  }
}

const exampleCsvFor = (fields: readonly TDestinationField[]): string =>
  serializeCsv(
    fields.map((field) => field.name),
    [fields.map((field) => field.example ?? '')],
  )

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
  exampleCsv: exampleCsvFor(fieldSet.fields),
  exampleFilename,
})

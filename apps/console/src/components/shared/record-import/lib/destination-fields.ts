import { normalizeFieldName, toHumanLabel } from '@/utils/strings'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import type { ImportFieldKind, ImportFieldMeta } from '@repo/codegen/src/import-fields.generated'
import { parseDelimitedText } from './delimited-file'
import { getImportEntityConfig } from './import-registry'
import type { TDestinationField, TDestinationFieldSet } from './types'

export type TImportFieldMetadata = Readonly<Record<string, ImportFieldMeta>>

const FUZZY_MATCHABLE_KINDS: ReadonlySet<ImportFieldKind> = new Set(['string', 'number', 'boolean', 'date', 'enum'])
const PRIMARY_FIELD_FALLBACKS = ['name', 'title']

export const buildDestinationFields = (entityType: ObjectTypes, sampleCsv: string, metadata: TImportFieldMetadata = {}): TDestinationFieldSet => {
  const sample = parseDelimitedText(sampleCsv, { previewRows: 1 })
  const { requiredFields, requiredOneOf, primaryField, autoValues } = getImportEntityConfig(entityType)
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
    }
  }

  const declared = (sample?.headers ?? []).map(toField)
  const declaredNames = new Set(declared.map((field) => normalizeFieldName(field.name)))
  const undeclared = [...requiredGroupNames.flat(), ...Object.keys(autoValues)]
    .filter((field, index, all) => all.indexOf(field) === index && !declaredNames.has(normalizeFieldName(field)))
    .map(toField)

  const fields = [...undeclared, ...declared].sort((a, b) => Number(Boolean(b.requirement)) - Number(Boolean(a.requirement)))
  const fieldByName = new Map(fields.map((field) => [normalizeFieldName(field.name), field]))
  const resolve = (name: string | undefined) => (name === undefined ? undefined : fieldByName.get(normalizeFieldName(name)))

  return {
    fields,
    requiredGroups: requiredGroupNames.map((group) => group.map(resolve).filter((field): field is TDestinationField => field !== undefined)),
    primaryField: [primaryField, ...PRIMARY_FIELD_FALLBACKS].map(resolve).find((field) => field !== undefined)?.name,
  }
}

import { normalizeFieldName, toHumanLabel } from '@/utils/strings'
import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { parseDelimitedText } from './delimited-file'
import { getImportEntityConfig } from './import-registry'
import type { TDestinationField } from './types'

export const buildDestinationFields = (entityType: ObjectTypes, sampleCsv: string): TDestinationField[] => {
  const sample = parseDelimitedText(sampleCsv, { previewRows: 1 })
  const { requiredFields, autoValues } = getImportEntityConfig(entityType)
  const requiredByName = new Set(requiredFields.map(normalizeFieldName))
  const autoValueByName = new Map(Object.entries(autoValues).map(([field, value]) => [normalizeFieldName(field), value]))

  const declared = (sample?.headers ?? []).map<TDestinationField>((header) => ({
    name: header,
    label: toHumanLabel(header),
    required: requiredByName.has(normalizeFieldName(header)),
    autoValue: autoValueByName.get(normalizeFieldName(header)),
  }))

  const declaredNames = new Set(declared.map((field) => normalizeFieldName(field.name)))
  const undeclared = [...requiredFields, ...Object.keys(autoValues)]
    .filter((field) => !declaredNames.has(normalizeFieldName(field)))
    .map<TDestinationField>((field) => ({
      name: field,
      label: toHumanLabel(field),
      required: requiredByName.has(normalizeFieldName(field)),
      autoValue: autoValueByName.get(normalizeFieldName(field)),
    }))

  return [...undeclared, ...declared].sort((a, b) => Number(b.required) - Number(a.required))
}

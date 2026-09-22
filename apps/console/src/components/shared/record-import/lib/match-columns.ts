import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { normalizeFieldName } from '@/utils/strings'
import { getImportAliases } from './import-registry'
import type { TColumnMapping, TDestinationField, TSourceColumn, TSuggestedConfidence } from './types'

const SEGMENTED_CODE = /^[A-Za-z]*\d+(?:[.\-_][A-Za-z]*\d+)+[A-Za-z]?$/
const CODE_HEADER = /(id|code|ref|reference|number)$/
const MIN_SEGMENTED_VALUE_RATIO = 0.5

const looksLikeReferenceCode = (column: TSourceColumn): boolean => {
  if (!CODE_HEADER.test(normalizeFieldName(column.header))) return false
  if (column.values.length === 0) return false

  const segmented = column.values.filter((value) => SEGMENTED_CODE.test(value)).length
  return segmented / column.values.length >= MIN_SEGMENTED_VALUE_RATIO
}

const VALUE_SHAPE_MATCHERS = new Map<string, (column: TSourceColumn) => boolean>([['refcode', looksLikeReferenceCode]])

type TCandidate = { field: string; confidence: TSuggestedConfidence }

const RANK: Record<TSuggestedConfidence, number> = { exact: 0, normalized: 1, alias: 2, pattern: 3, none: 4 }

const buildFieldIndex = (fields: TDestinationField[], aliases: Record<string, readonly string[]>) => {
  const exactHeaders = new Set<string>()
  const byNormalizedHeader = new Map<string, string>()
  const byAlias = new Map<string, string>()
  const shapeMatchers: { field: string; matches: (column: TSourceColumn) => boolean }[] = []

  fields.forEach((field) => {
    const normalized = normalizeFieldName(field.name)
    exactHeaders.add(field.name)
    if (!byNormalizedHeader.has(normalized)) byNormalizedHeader.set(normalized, field.name)

    aliases[normalized]?.forEach((alias) => {
      if (!byAlias.has(alias)) byAlias.set(alias, field.name)
    })

    const matches = VALUE_SHAPE_MATCHERS.get(normalized)
    if (matches) shapeMatchers.push({ field: field.name, matches })
  })

  return { exactHeaders, byNormalizedHeader, byAlias, shapeMatchers }
}

type TFieldIndex = ReturnType<typeof buildFieldIndex>

const findCandidate = (column: TSourceColumn, index: TFieldIndex): TCandidate | null => {
  const normalizedHeader = normalizeFieldName(column.header)

  if (index.exactHeaders.has(column.header)) return { field: column.header, confidence: 'exact' }

  const normalized = index.byNormalizedHeader.get(normalizedHeader)
  if (normalized) return { field: normalized, confidence: 'normalized' }

  const alias = index.byAlias.get(normalizedHeader)
  if (alias) return { field: alias, confidence: 'alias' }

  const shapeMatch = index.shapeMatchers.find((matcher) => matcher.matches(column))
  return shapeMatch ? { field: shapeMatch.field, confidence: 'pattern' } : null
}

export const matchColumns = (entityType: ObjectTypes, columns: TSourceColumn[], fields: TDestinationField[]): Record<number, TColumnMapping> => {
  const index = buildFieldIndex(fields, getImportAliases(entityType))
  const claimedBy = new Map<string, { columnIndex: number; confidence: TSuggestedConfidence }>()
  const mapping: Record<number, TColumnMapping> = {}
  const ignore: TColumnMapping = { field: null, confidence: 'none' }

  columns.forEach((column) => {
    const candidate = findCandidate(column, index)
    if (!candidate) {
      mapping[column.index] = ignore
      return
    }

    const claim = claimedBy.get(candidate.field)
    if (claim && RANK[claim.confidence] <= RANK[candidate.confidence]) {
      mapping[column.index] = ignore
      return
    }

    if (claim) mapping[claim.columnIndex] = ignore

    claimedBy.set(candidate.field, { columnIndex: column.index, confidence: candidate.confidence })
    mapping[column.index] = candidate
  })

  return mapping
}

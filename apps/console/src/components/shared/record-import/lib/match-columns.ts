import { type ObjectTypes } from '@repo/codegen/src/type-names'
import { normalizeFieldName, pluralizeTypeName, toHumanLabel, wordTokens } from '@/utils/strings'
import { getImportAliases } from './import-registry'
import type { TColumnMapping, TDestinationFieldSet, TSourceColumn, TSuggestedConfidence } from './types'

const SEGMENTED_CODE = /^[A-Za-z]*\d+(?:[.\-_][A-Za-z]*\d+)+[A-Za-z]?$/
const CODE_HEADER = /(id|code|ref|reference|number)$/
const MIN_SEGMENTED_VALUE_RATIO = 0.5

const FILLER_TOKENS = new Set(['at', 'on', 'the', 'of', 'date', 'last'])
const PLURAL_SUFFIX = /s$/
const MIN_SINGULAR_LENGTH = 3

const looksLikeReferenceCode = (column: TSourceColumn): boolean => {
  if (!CODE_HEADER.test(normalizeFieldName(column.header))) return false
  if (column.values.length === 0) return false

  const segmented = column.values.filter((value) => SEGMENTED_CODE.test(value)).length
  return segmented / column.values.length >= MIN_SEGMENTED_VALUE_RATIO
}

const VALUE_SHAPE_MATCHERS = new Map<string, (column: TSourceColumn) => boolean>([['refcode', looksLikeReferenceCode]])

const singular = (token: string): string => {
  const trimmed = token.replace(PLURAL_SUFFIX, '')
  return trimmed.length >= MIN_SINGULAR_LENGTH ? trimmed : token
}

const tokenSetKey = (value: string): string =>
  [
    ...new Set(
      wordTokens(toHumanLabel(value))
        .filter((token) => !FILLER_TOKENS.has(token))
        .map(singular),
    ),
  ]
    .sort()
    .join(' ')

type TCandidate = { field: string; confidence: TSuggestedConfidence }

const RANK: Record<TSuggestedConfidence, number> = { exact: 0, normalized: 1, alias: 2, suggested: 3, pattern: 4, none: 5 }

const buildFieldIndex = ({ fields, primaryField }: TDestinationFieldSet, entityLabels: string[], aliases: Record<string, readonly string[]>) => {
  const exactHeaders = new Set<string>()
  const byNormalizedHeader = new Map<string, string>()
  const byAlias = new Map<string, string>()
  const fieldsByTokenKey = new Map<string, string[]>()
  const shapeMatchers: { field: string; matches: (column: TSourceColumn) => boolean }[] = []

  fields.forEach((field) => {
    const normalized = normalizeFieldName(field.name)
    exactHeaders.add(field.name)
    if (!byNormalizedHeader.has(normalized)) byNormalizedHeader.set(normalized, field.name)
    if (!field.fuzzyMatchable) return

    aliases[normalized]?.forEach((alias) => {
      if (!byAlias.has(alias)) byAlias.set(alias, field.name)
    })

    const tokenKey = tokenSetKey(field.name)
    if (tokenKey) fieldsByTokenKey.set(tokenKey, [...(fieldsByTokenKey.get(tokenKey) ?? []), field.name])

    const matches = VALUE_SHAPE_MATCHERS.get(normalized)
    if (matches) shapeMatchers.push({ field: field.name, matches })
  })

  const primary = fields.find((field) => field.name === primaryField && field.fuzzyMatchable)
  const entityNames = new Set(primary ? entityLabels.flatMap((label) => [label, pluralizeTypeName(label)]).map(normalizeFieldName) : [])

  return { exactHeaders, byNormalizedHeader, byAlias, fieldsByTokenKey, shapeMatchers, primaryField: primary?.name, entityNames }
}

type TFieldIndex = ReturnType<typeof buildFieldIndex>

const findCandidate = (column: TSourceColumn, index: TFieldIndex): TCandidate | null => {
  const normalizedHeader = normalizeFieldName(column.header)

  if (index.exactHeaders.has(column.header)) return { field: column.header, confidence: 'exact' }

  const normalized = index.byNormalizedHeader.get(normalizedHeader)
  if (normalized) return { field: normalized, confidence: 'normalized' }

  const alias = index.byAlias.get(normalizedHeader)
  if (alias) return { field: alias, confidence: 'alias' }

  if (index.primaryField && index.entityNames.has(normalizedHeader)) return { field: index.primaryField, confidence: 'suggested' }

  const tokenMatches = index.fieldsByTokenKey.get(tokenSetKey(column.header))
  if (tokenMatches?.length === 1) return { field: tokenMatches[0], confidence: 'suggested' }

  const shapeMatch = index.shapeMatchers.find((matcher) => matcher.matches(column))
  return shapeMatch ? { field: shapeMatch.field, confidence: 'pattern' } : null
}

export const isEmptyColumn = (column: TSourceColumn): boolean => column.filledCount === 0

export const matchColumns = ({
  entityType,
  entityLabels,
  columns,
  fieldSet,
}: {
  entityType: ObjectTypes
  entityLabels: string[]
  columns: TSourceColumn[]
  fieldSet: TDestinationFieldSet
}): Record<number, TColumnMapping> => {
  const index = buildFieldIndex(fieldSet, [toHumanLabel(entityType), ...entityLabels], getImportAliases(entityType))
  const claimedBy = new Map<string, { columnIndex: number; confidence: TSuggestedConfidence }>()
  const mapping: Record<number, TColumnMapping> = {}
  const ignore: TColumnMapping = { field: null, confidence: 'none' }

  columns.forEach((column) => {
    const candidate = isEmptyColumn(column) ? null : findCandidate(column, index)
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

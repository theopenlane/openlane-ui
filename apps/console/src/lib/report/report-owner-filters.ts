import { z } from 'zod'
import { REPORT_OWNER_KINDS, type TReportEntity, type TReportOperator, type TReportOwner, type TReportOwnerKind } from '@repo/codegen/src/report-schema.generated'
import { responsibilityChoiceSchema } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { combineClauses, wherePredicate, type TWhereClause } from './report-schema'

export type TOwnerFilterField = { name: string; kind: 'owner'; owner: TReportOwner }

const ownerSelectionSchema = responsibilityChoiceSchema.pick({ type: true, value: true, displayName: true })

export type TOwnerSelection = z.infer<typeof ownerSelectionSchema>

export const toOwnerFilterField = (owner: TReportOwner): TOwnerFilterField => ({ name: owner.name, kind: 'owner', owner })

const ownerColumns = (owner: TReportOwner): [TReportOwnerKind, string][] => REPORT_OWNER_KINDS.flatMap((kind) => (owner[kind] ? [[kind, owner[kind]] as [TReportOwnerKind, string]] : []))

export const ownerColumnNames = (owner: TReportOwner): string[] => ownerColumns(owner).map(([, column]) => column)

export const ownerKinds = (field: TOwnerFilterField): TReportOwnerKind[] => ownerColumns(field.owner).map(([kind]) => kind)

const ownerSelectionsSchema = z.array(ownerSelectionSchema)

const parseOwnerSelections = (value: string): TOwnerSelection[] => {
  if (value === '') return []

  try {
    const parsed = ownerSelectionsSchema.safeParse(JSON.parse(value))

    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export const fieldOwnerSelections = (field: TOwnerFilterField, value: string): TOwnerSelection[] => parseOwnerSelections(value).filter((selection) => field.owner[selection.type])

export const serializeOwnerSelections = (selections: TOwnerSelection[]): string => (selections.length === 0 ? '' : JSON.stringify(selections))

export const ownerSelectionKey = (selection: TOwnerSelection): string => `${selection.type}:${selection.value}`

const emptyClause = (kind: TReportOwnerKind, column: string): TWhereClause =>
  kind === 'string' ? { or: [wherePredicate(column, 'isNil', true), wherePredicate(column, 'eq', '')] } : wherePredicate(column, 'isNil', true)

const presentClause = (kind: TReportOwnerKind, column: string): TWhereClause =>
  kind === 'string' ? { and: [wherePredicate(column, 'notNil', true), wherePredicate(column, 'neq', '')] } : wherePredicate(column, 'notNil', true)

const matchClauses = (kind: TReportOwnerKind, column: string, values: string[]): TWhereClause[] =>
  kind === 'string' ? values.map((value) => wherePredicate(column, 'containsFold', value)) : [wherePredicate(column, 'in', values)]

const excludeClauses = (kind: TReportOwnerKind, column: string, values: string[]): TWhereClause[] =>
  kind === 'string'
    ? values.map((value) => ({ or: [wherePredicate(column, 'isNil', true), { not: wherePredicate(column, 'containsFold', value) }] }))
    : [{ or: [wherePredicate(column, 'isNil', true), wherePredicate(column, 'notIn', values)] }]

export const isOwnerFilterComplete = (field: TOwnerFilterField, operator: TReportOperator, value: string): boolean =>
  operator === 'isNil' || operator === 'notNil' || fieldOwnerSelections(field, value).length > 0

export const ownerFilterClause = (field: TOwnerFilterField, operator: TReportOperator, value: string): TWhereClause | null => {
  const columns = ownerColumns(field.owner)

  if (operator === 'isNil')
    return combineClauses(
      'and',
      columns.map(([kind, column]) => emptyClause(kind, column)),
    )
  if (operator === 'notNil')
    return combineClauses(
      'or',
      columns.map(([kind, column]) => presentClause(kind, column)),
    )
  if (operator !== 'in' && operator !== 'notIn') return null

  const selections = fieldOwnerSelections(field, value)
  const clauses = columns.flatMap(([kind, column]) => {
    const values = [...new Set(selections.filter((selection) => selection.type === kind).map((selection) => selection.value))]
    if (values.length === 0) return []

    return operator === 'in' ? matchClauses(kind, column, values) : excludeClauses(kind, column, values)
  })

  return combineClauses(operator === 'in' ? 'or' : 'and', clauses)
}

const LEGACY_MATCH_OPERATORS: Partial<Record<TReportOperator, TReportOperator>> = { eq: 'in', in: 'in', neq: 'notIn', notIn: 'notIn' }

const LEGACY_TEXT_MATCH_OPERATORS: Partial<Record<TReportOperator, TReportOperator>> = { containsFold: 'in' }

const LEGACY_PRESENCE_OPERATORS: TReportOperator[] = ['isNil', 'notNil']

export type TLegacyOwnerFilter = { field: string; operator: TReportOperator; values: string[] }

export const migrateLegacyOwnerFilter = (entity: TReportEntity, legacy: TLegacyOwnerFilter): { field: string; operator: TReportOperator; value: string } | null => {
  for (const owner of entity.owners) {
    const columns = ownerColumns(owner)
    const kind = columns.find(([, column]) => column === legacy.field)?.[0]
    if (!kind) continue

    if (LEGACY_PRESENCE_OPERATORS.includes(legacy.operator)) return columns.length === 1 ? { field: owner.name, operator: legacy.operator, value: '' } : null

    const operator = (kind === 'string' ? LEGACY_TEXT_MATCH_OPERATORS : LEGACY_MATCH_OPERATORS)[legacy.operator]
    if (!operator || legacy.values.length === 0) return null

    return { field: owner.name, operator, value: serializeOwnerSelections(legacy.values.map((value) => ({ type: kind, value }))) }
  }

  return null
}

export const isOwnerColumn = (entity: TReportEntity, name: string): boolean => entity.owners.some((owner) => ownerColumnNames(owner).includes(name))

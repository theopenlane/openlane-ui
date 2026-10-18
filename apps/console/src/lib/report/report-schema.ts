import {
  REPORT_EDGE_FIELDS,
  REPORT_ENTITIES,
  REPORT_ENUM_VALUES,
  REPORT_OPERATOR_SETS,
  REPORT_OPERATOR_SUFFIX,
  type TReportEdge,
  type TReportEntity,
  type TReportField,
  type TReportOperator,
} from '@repo/codegen/src/report-schema.generated'
import { type OrderDirection } from '@repo/codegen/src/schema'
import { toHumanLabel } from '@/utils/strings'

export const PATH_SEPARATOR = '.'

export type TReportColumn = {
  path: string
  label: string
  field: TReportField
  edges: TReportEdge[]
}

export type TReportOrder = { field: string; direction: OrderDirection }

export type TReportSort = { field: string | null; direction: OrderDirection }

export type TLabelled<T> = { item: T; label: string }

export type TReportCombinator = 'and' | 'or'

export type TWhereClause = Record<string, unknown>

export const wherePredicate = (field: string, operator: TReportOperator, value: unknown): TWhereClause => ({ [`${field}${REPORT_OPERATOR_SUFFIX[operator]}`]: value })

export const combineClauses = (combinator: TReportCombinator, clauses: TWhereClause[]): TWhereClause | null => {
  if (clauses.length === 0) return null
  if (clauses.length === 1) return clauses[0]

  return { [combinator]: clauses }
}

const withLabels = <T>(items: T[], name: (item: T) => string): TLabelled<T>[] => items.map((item) => ({ item, label: toHumanLabel(name(item)) })).sort((a, b) => a.label.localeCompare(b.label))

const memoizedLabels = <T>(name: (item: T) => string) => {
  const cache = new WeakMap<T[], TLabelled<T>[]>()

  return (items: T[]): TLabelled<T>[] => {
    const cached = cache.get(items)
    if (cached) return cached

    const labelled = withLabels(items, name)
    cache.set(items, labelled)

    return labelled
  }
}

export const labelledFields = <T extends { name: string }>(fields: T[]): TLabelled<T>[] => withLabels(fields, (field) => field.name)

export const labelledSchemaFields = memoizedLabels<TReportField>((field) => field.name)

export const entityOptions = REPORT_ENTITIES.map((entity) => ({ value: entity.queryName, label: toHumanLabel(entity.queryName), objectType: entity.objectType })).sort((a, b) =>
  a.label.localeCompare(b.label),
)

const entityByQueryName = new Map(REPORT_ENTITIES.map((entity) => [entity.queryName, entity]))
const entityByTypeName = new Map(REPORT_ENTITIES.map((entity) => [entity.typeName, entity]))

export const getEntity = (queryName: string): TReportEntity | undefined => entityByQueryName.get(queryName)

export const MAX_EDGE_DEPTH = 2

export const getTargetEntity = (edge: TReportEdge): TReportEntity | undefined => entityByTypeName.get(edge.target)

export const getRelatedEdges = (edge: TReportEdge): TReportEdge[] => getTargetEntity(edge)?.edges ?? []

export const getEdgeFields = (edge: TReportEdge): TReportField[] => getTargetEntity(edge)?.fields ?? REPORT_EDGE_FIELDS[edge.target] ?? []

export const getFieldOperators = (field: TReportField): TReportOperator[] => (field.operatorSet === undefined ? [] : (REPORT_OPERATOR_SETS[field.operatorSet] ?? []))

export const getEnumValues = (field: TReportField): string[] => (field.enumName ? (REPORT_ENUM_VALUES[field.enumName] ?? []) : [])

export const buildPath = (...segments: string[]): string => segments.filter(Boolean).join(PATH_SEPARATOR)

export const pathSegments = (path: string): string[] => (path === '' ? [] : path.split(PATH_SEPARATOR))

export const pathEdgeName = (path: string): string | null => {
  const separator = path.indexOf(PATH_SEPARATOR)

  return separator === -1 ? null : path.slice(0, separator)
}

export const pathLabel = (path: string): string => pathSegments(path).map(toHumanLabel).join(' › ')

export const edgeChainPath = (edges: TReportEdge[]): string => buildPath(...edges.map((edge) => edge.name))

export const isListChain = (edges: TReportEdge[]): boolean => edges.some((edge) => edge.list)

export const labelledOrderFields = (entity: TReportEntity): TLabelled<string>[] => withLabels(entity.order?.fields ?? [], (value) => value)

export const labelledEdges = memoizedLabels<TReportEdge>((edge) => edge.name)

export const resolveEdgeChain = (entity: TReportEntity, names: string[]): TReportEdge[] | undefined => {
  if (names.length > MAX_EDGE_DEPTH) return undefined

  const chain: TReportEdge[] = []
  let available = entity.edges

  for (const name of names) {
    const edge = available.find((item) => item.name === name)
    if (!edge) return undefined

    chain.push(edge)
    available = getRelatedEdges(edge)
  }

  return chain
}

export const splitFieldPath = (entity: TReportEntity, path: string): { edges: TReportEdge[]; fieldName: string } | undefined => {
  const segments = pathSegments(path)
  const fieldName = segments.at(-1)
  const edges = fieldName ? resolveEdgeChain(entity, segments.slice(0, -1)) : undefined

  return fieldName && edges ? { edges, fieldName } : undefined
}

export const resolveColumn = (entity: TReportEntity, path: string): TReportColumn | undefined => {
  const split = splitFieldPath(entity, path)
  if (!split) return undefined

  const last = split.edges.at(-1)
  const field = (last ? getEdgeFields(last) : entity.fields).find((item) => item.name === split.fieldName)

  return field ? { path, label: pathLabel(path), field, edges: split.edges } : undefined
}

export const resolveColumns = (entity: TReportEntity | undefined, paths: string[]): TReportColumn[] =>
  entity ? paths.map((path) => resolveColumn(entity, path)).filter((column): column is TReportColumn => column !== undefined) : []

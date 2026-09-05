import {
  REPORT_EDGE_FIELDS,
  REPORT_ENTITIES,
  REPORT_ENUM_VALUES,
  REPORT_OPERATOR_SETS,
  type TReportEdge,
  type TReportEntity,
  type TReportField,
  type TReportOperator,
} from '@repo/codegen/src/report-schema.generated'
import { toHumanLabel } from '@/utils/strings'

export const PATH_SEPARATOR = '.'

export type TReportColumn = {
  path: string
  label: string
  field: TReportField
  edge?: TReportEdge
}

export type TLabelled<T> = { item: T; label: string }

const withLabels = <T>(items: T[], name: (item: T) => string): TLabelled<T>[] => items.map((item) => ({ item, label: toHumanLabel(name(item)) })).sort((a, b) => a.label.localeCompare(b.label))

export const labelledFields = (fields: TReportField[]): TLabelled<TReportField>[] => withLabels(fields, (field) => field.name)

export const entityOptions = REPORT_ENTITIES.map((entity) => ({ value: entity.queryName, label: toHumanLabel(entity.queryName), objectType: entity.objectType })).sort((a, b) =>
  a.label.localeCompare(b.label),
)

const entityByQueryName = new Map(REPORT_ENTITIES.map((entity) => [entity.queryName, entity]))
const entityByTypeName = new Map(REPORT_ENTITIES.map((entity) => [entity.typeName, entity]))

export const getEntity = (queryName: string): TReportEntity | undefined => entityByQueryName.get(queryName)

const withoutOperators = (fields: TReportField[]): TReportField[] => fields.map(({ name, kind, list, enumName }) => ({ name, kind, list, enumName }))

const edgeFieldsByTarget = new Map<string, TReportField[]>()

export const getEdgeFields = (edge: TReportEdge): TReportField[] => {
  const cached = edgeFieldsByTarget.get(edge.target)
  if (cached) return cached

  const entityFields = entityByTypeName.get(edge.target)?.fields
  const fields = REPORT_EDGE_FIELDS[edge.target] ?? (entityFields ? withoutOperators(entityFields) : [])

  edgeFieldsByTarget.set(edge.target, fields)

  return fields
}

export const getFieldOperators = (field: TReportField): TReportOperator[] => (field.operatorSet === undefined ? [] : (REPORT_OPERATOR_SETS[field.operatorSet] ?? []))

export const getEnumValues = (field: TReportField): string[] => (field.enumName ? (REPORT_ENUM_VALUES[field.enumName] ?? []) : [])

export const buildPath = (edgeName: string, fieldName: string): string => `${edgeName}${PATH_SEPARATOR}${fieldName}`

export const pathLabel = (path: string): string => path.split(PATH_SEPARATOR).map(toHumanLabel).join(' › ')

export const labelledEdges = (entity: TReportEntity): TLabelled<TReportEdge>[] => withLabels(entity.edges, (edge) => edge.name)

export const buildColumnIndex = (entity: TReportEntity): Map<string, TReportColumn> => {
  const index = new Map<string, TReportColumn>()

  for (const field of entity.fields) {
    index.set(field.name, { path: field.name, label: pathLabel(field.name), field })
  }

  for (const edge of entity.edges) {
    for (const field of getEdgeFields(edge)) {
      const path = buildPath(edge.name, field.name)
      index.set(path, { path, label: pathLabel(path), field, edge })
    }
  }

  return index
}

export const resolveColumns = (index: Map<string, TReportColumn>, paths: string[]): TReportColumn[] =>
  paths.map((path) => index.get(path)).filter((column): column is TReportColumn => column !== undefined)

export const filterableFields = (entity: TReportEntity): TReportField[] => entity.fields.filter((field) => getFieldOperators(field).length > 0)

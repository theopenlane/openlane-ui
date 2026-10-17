import type { TReportEdge, TReportEntity } from '@repo/codegen/src/report-schema.generated'
import type { TPaginationQuery } from '@repo/ui/pagination-types'
import { mergeWhere } from '@/lib/merge-where'
import { excludeSystemOwnedWhere } from './report-filters'
import { buildPath, PATH_SEPARATOR, type TReportColumn, type TReportOrder } from './report-schema'

export const REPORT_OPERATION_NAME = 'CustomReport'

export const RELATED_RECORD_LIMIT = 25

const GRAPHQL_NAME = /^[_A-Za-z][_0-9A-Za-z]*$/

export type TReportQuery = {
  query: string
  variables: Record<string, unknown>
}

type TBuildReportQueryArgs = {
  entity: TReportEntity
  columns: TReportColumn[]
  where: Record<string, unknown> | null
  relatedWhere: Record<string, unknown>
  orderBy: TReportOrder | null
  pageQuery: TPaginationQuery
}

type TRelatedWhereVariables = {
  relatedWhere: Record<string, unknown>
  variables: Record<string, unknown>
  definitions: string[]
}

type TSelection = {
  name: string
  children: TSelection[]
}

const schemaName = (name: string): string => {
  if (!GRAPHQL_NAME.test(name)) throw new Error(`Invalid GraphQL name: ${name}`)

  return name
}

const leaf = (name: string): TSelection => ({ name: schemaName(name), children: [] })

const renderSelections = (selections: TSelection[], depth: number): string[] => {
  const indent = '  '.repeat(depth)

  return selections.flatMap((selection) =>
    selection.children.length === 0 ? [`${indent}${selection.name}`] : [`${indent}${selection.name} {`, ...renderSelections(selection.children, depth + 1), `${indent}}`],
  )
}

type TSelectionTree = {
  fields: string[]
  edges: Map<string, { edge: TReportEdge; tree: TSelectionTree }>
}

const emptyTree = (): TSelectionTree => ({ fields: [], edges: new Map() })

const addColumn = (tree: TSelectionTree, edges: TReportEdge[], fieldName: string) => {
  const [edge, ...rest] = edges

  if (!edge) {
    if (!tree.fields.includes(fieldName)) tree.fields.push(fieldName)
    return
  }

  const branch = tree.edges.get(edge.name) ?? { edge, tree: emptyTree() }
  tree.edges.set(edge.name, branch)
  addColumn(branch.tree, rest, fieldName)
}

const connectionArgs = (edge: TReportEdge, path: string, related: TRelatedWhereVariables): string => {
  const where = related.relatedWhere[path]
  if (!where || !edge.whereTypeName) return `first: ${RELATED_RECORD_LIMIT}`

  const variable = `where_${path.split(PATH_SEPARATOR).join('_')}`
  related.variables[variable] = where
  related.definitions.push(`$${variable}: ${schemaName(edge.whereTypeName)}`)

  return `first: ${RELATED_RECORD_LIMIT}, where: $${variable}`
}

const treeSelections = (tree: TSelectionTree, prefix: string[], related: TRelatedWhereVariables): TSelection[] => [
  ...tree.fields.map(leaf),
  ...[...tree.edges.values()].map(({ edge, tree: branch }) => {
    const chain = [...prefix, edge.name]
    const children = treeSelections(branch, chain, related)

    return edge.connection
      ? { name: `${schemaName(edge.name)}(${connectionArgs(edge, buildPath(...chain), related)})`, children: [{ name: 'edges', children: [{ name: 'node', children }] }] }
      : { name: schemaName(edge.name), children }
  }),
]

const nodeSelections = (columns: TReportColumn[], related: TRelatedWhereVariables): TSelection[] => {
  const tree = emptyTree()

  for (const column of columns) addColumn(tree, column.edges, column.field.name)

  return treeSelections(tree, [], related)
}

export const buildReportQuery = ({ entity, columns, where, relatedWhere, orderBy, pageQuery }: TBuildReportQueryArgs): TReportQuery => {
  const variables: Record<string, unknown> = {}
  const definitions: string[] = []
  const args: string[] = []

  const scopedWhere = mergeWhere<Record<string, unknown>>([excludeSystemOwnedWhere(entity), where])

  if (Object.keys(scopedWhere).length > 0) {
    variables.where = scopedWhere
    definitions.push(`$where: ${schemaName(entity.whereTypeName)}`)
    args.push('where: $where')
  }

  if (orderBy && entity.order) {
    variables.orderBy = [orderBy]
    definitions.push(`$orderBy: [${schemaName(entity.order.typeName)}!]`)
    args.push('orderBy: $orderBy')
  }

  const cursorArgs: [keyof TPaginationQuery, string][] = [
    ['first', 'Int'],
    ['last', 'Int'],
    ['after', 'Cursor'],
    ['before', 'Cursor'],
  ]

  for (const [name, type] of cursorArgs) {
    const value = pageQuery[name]
    if (value === undefined || value === null) continue

    variables[name] = value
    definitions.push(`$${name}: ${type}`)
    args.push(`${name}: $${name}`)
  }

  const document: TSelection[] = [
    {
      name: `${schemaName(entity.queryName)}${args.length > 0 ? `(${args.join(', ')})` : ''}`,
      children: [
        leaf('totalCount'),
        { name: 'pageInfo', children: [leaf('hasNextPage'), leaf('hasPreviousPage'), leaf('startCursor'), leaf('endCursor')] },
        { name: 'edges', children: [{ name: 'node', children: nodeSelections(columns, { relatedWhere, variables, definitions }) }] },
      ],
    },
  ]

  const query = [`query ${REPORT_OPERATION_NAME}${definitions.length > 0 ? `(${definitions.join(', ')})` : ''} {`, ...renderSelections(document, 1), '}'].join('\n')

  return { query, variables }
}

import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import type { TPaginationQuery } from '@repo/ui/pagination-types'
import type { TReportColumn } from './report-schema'

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
  pageQuery: TPaginationQuery
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

const nodeSelections = (columns: TReportColumn[]): TSelection[] => {
  const selections: TSelection[] = []
  const byEdge = new Map<string, TReportColumn[]>()

  for (const column of columns) {
    if (!column.edge) {
      selections.push(leaf(column.field.name))
      continue
    }

    const grouped = byEdge.get(column.edge.name)
    if (grouped) grouped.push(column)
    else byEdge.set(column.edge.name, [column])
  }

  for (const edgeColumns of byEdge.values()) {
    const edge = edgeColumns[0].edge
    if (!edge) continue

    const fields = edgeColumns.map((column) => leaf(column.field.name))

    selections.push({
      name: edge.connection ? `${schemaName(edge.name)}(first: ${RELATED_RECORD_LIMIT})` : schemaName(edge.name),
      children: edge.connection ? [{ name: 'edges', children: [{ name: 'node', children: fields }] }] : fields,
    })
  }

  return selections
}

export const buildReportQuery = ({ entity, columns, where, pageQuery }: TBuildReportQueryArgs): TReportQuery => {
  const variables: Record<string, unknown> = {}
  const definitions: string[] = []
  const args: string[] = []

  if (where) {
    variables.where = where
    definitions.push(`$where: ${schemaName(entity.whereTypeName)}`)
    args.push('where: $where')
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
        { name: 'edges', children: [{ name: 'node', children: nodeSelections(columns) }] },
      ],
    },
  ]

  const query = [`query ${REPORT_OPERATION_NAME}${definitions.length > 0 ? `(${definitions.join(', ')})` : ''} {`, ...renderSelections(document, 1), '}'].join('\n')

  return { query, variables }
}

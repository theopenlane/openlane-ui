import { gql, type ApiSession } from './api'

interface TypeRef {
  name: string | null
  kind: string
  ofType?: TypeRef | null
}

interface IntrospectedField {
  name: string
  isDeprecated: boolean
  deprecationReason: string | null
  type: TypeRef
}

interface IntrospectedType {
  __type: { fields: IntrospectedField[] | null } | null
}

interface DeprecatedFieldPath {
  path: string
  reason: string
}

interface FieldPathReport {
  unknown: string[]
  deprecated: DeprecatedFieldPath[]
}

const TYPE_FIELDS_QUERY = `query($name: String!){ __type(name: $name){ fields(includeDeprecated: true) { name isDeprecated deprecationReason type { name kind ofType { name kind ofType { name kind ofType { name kind } } } } } } }`

const LEAF_KINDS = new Set(['SCALAR', 'ENUM'])

const namedType = (ref: TypeRef): TypeRef => (ref.ofType ? namedType(ref.ofType) : ref)

type PathStatus = { kind: 'valid' } | { kind: 'unknown' } | { kind: 'deprecated'; reason: string }

export const classifyFieldPaths = async (sess: ApiSession, rootType: string, paths: string[]): Promise<FieldPathReport> => {
  const fieldsByType = new Map<string, Promise<Map<string, IntrospectedField>>>()

  const fieldsOf = (typeName: string): Promise<Map<string, IntrospectedField>> => {
    const cached = fieldsByType.get(typeName)
    if (cached) return cached

    const pending = gql<IntrospectedType>(sess, TYPE_FIELDS_QUERY, { name: typeName }).then(({ data, errors }) => {
      const fields = data?.__type?.fields
      if (errors?.length || !fields) throw new Error(`could not introspect ${typeName} (core only serves introspection with server.dev enabled): ${JSON.stringify(errors ?? data)}`)
      return new Map(fields.map((field) => [field.name, field]))
    })
    fieldsByType.set(typeName, pending)
    return pending
  }

  const nodeTypeOf = async (typeName: string): Promise<string> => {
    const edges = (await fieldsOf(typeName)).get('edges')
    if (!edges) return typeName

    const node = (await fieldsOf(namedType(edges.type).name ?? '')).get('node')
    return node ? (namedType(node.type).name ?? typeName) : typeName
  }

  const statusOf = async (path: string): Promise<PathStatus> => {
    const segments = path.split('.')
    let current = rootType
    let deprecationReason: string | null = null

    for (const [index, segment] of segments.entries()) {
      const field = (await fieldsOf(await nodeTypeOf(current))).get(segment)
      if (!field) return { kind: 'unknown' }

      const target = namedType(field.type)
      const isLast = index === segments.length - 1
      if (LEAF_KINDS.has(target.kind) !== isLast || !target.name) return { kind: 'unknown' }
      if (field.isDeprecated) deprecationReason ??= field.deprecationReason ?? `${segment} is deprecated`
      current = target.name
    }

    return deprecationReason === null ? { kind: 'valid' } : { kind: 'deprecated', reason: deprecationReason }
  }

  const report: FieldPathReport = { unknown: [], deprecated: [] }
  const statuses = await Promise.all(paths.map(async (path) => ({ path, status: await statusOf(path) })))
  statuses.forEach(({ path, status }) => {
    if (status.kind === 'unknown') report.unknown.push(path)
    if (status.kind === 'deprecated') report.deprecated.push({ path, reason: status.reason })
  })
  return report
}

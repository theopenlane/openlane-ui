import { gql, type ApiSession } from './api'

interface TypeRef {
  name: string | null
  kind: string
  ofType?: TypeRef | null
}

interface IntrospectedType {
  __type: { fields: Array<{ name: string; type: TypeRef }> | null } | null
}

const TYPE_FIELDS_QUERY = `query($name: String!){ __type(name: $name){ fields { name type { name kind ofType { name kind ofType { name kind ofType { name kind } } } } } } }`

const LEAF_KINDS = new Set(['SCALAR', 'ENUM'])

const namedType = (ref: TypeRef): TypeRef => (ref.ofType ? namedType(ref.ofType) : ref)

export const findUnknownFieldPaths = async (sess: ApiSession, rootType: string, paths: string[]): Promise<string[]> => {
  const fieldsByType = new Map<string, Promise<Map<string, TypeRef>>>()

  const fieldsOf = (typeName: string): Promise<Map<string, TypeRef>> => {
    const cached = fieldsByType.get(typeName)
    if (cached) return cached

    const pending = gql<IntrospectedType>(sess, TYPE_FIELDS_QUERY, { name: typeName }).then(({ data, errors }) => {
      const fields = data?.__type?.fields
      if (errors?.length || !fields) throw new Error(`could not introspect ${typeName} (core only serves introspection with server.dev enabled): ${JSON.stringify(errors ?? data)}`)
      return new Map(fields.map((field) => [field.name, field.type]))
    })
    fieldsByType.set(typeName, pending)
    return pending
  }

  const nodeTypeOf = async (typeName: string): Promise<string> => {
    const edges = (await fieldsOf(typeName)).get('edges')
    if (!edges) return typeName

    const node = (await fieldsOf(namedType(edges).name ?? '')).get('node')
    return node ? (namedType(node).name ?? typeName) : typeName
  }

  const isValidPath = async (path: string): Promise<boolean> => {
    const segments = path.split('.')
    let current = rootType

    for (const [index, segment] of segments.entries()) {
      const field = (await fieldsOf(await nodeTypeOf(current))).get(segment)
      if (!field) return false

      const target = namedType(field)
      const isLast = index === segments.length - 1
      if (LEAF_KINDS.has(target.kind) !== isLast || !target.name) return false
      current = target.name
    }

    return true
  }

  const results = await Promise.all(paths.map(async (path) => ((await isValidPath(path)) ? null : path)))
  return results.filter((path): path is string => path !== null)
}

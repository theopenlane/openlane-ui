const fs = require('fs')
const path = require('path')
const { pluralizeTypeName, isExcludedType, DISPLAY_FIELD_ORDER, EXCLUDED_FIELDS, EXCLUDED_ASSOCIATIONS } = require('./lib')

const introspectionPath = path.join(__dirname, '..', 'src', 'introspectionschema.json')
const typeNamesPath = path.join(__dirname, '..', 'src', 'type-names.ts')
const outputPath = path.join(__dirname, '..', 'src', 'report-schema.generated.ts')

const OWNER_FIELD = 'ownerID'

const SENSITIVE_FIELDS = ['credentials', 'credentialSet', 'secretName', 'secretValue', 'clientSecret', 'privateKey', 'password']

const SENSITIVE_EDGE_TARGETS = ['Hush', 'APIToken', 'PersonalAccessToken', 'Webauthn', 'TFASetting']

const readObjectTypes = () => {
  const block = fs.readFileSync(typeNamesPath, 'utf8').match(/export enum ObjectTypes \{([\s\S]*?)\n\}/)

  if (!block) {
    throw new Error('could not find the ObjectTypes enum in type-names.ts')
  }

  return new Map([...block[1].matchAll(/^\s*(\w+) = '([^']+)',/gm)].map(([, member, value]) => [value.toLowerCase(), member]))
}

const SCALAR_KINDS = {
  ID: 'id',
  String: 'string',
  Int: 'int',
  Float: 'float',
  Decimal: 'float',
  Boolean: 'boolean',
  Time: 'time',
  Date: 'time',
  DateTime: 'time',
}

const OPERATOR_SUFFIXES = {
  eq: '',
  neq: 'NEQ',
  in: 'In',
  notIn: 'NotIn',
  gt: 'GT',
  gte: 'GTE',
  lt: 'LT',
  lte: 'LTE',
  contains: 'Contains',
  containsFold: 'ContainsFold',
  equalFold: 'EqualFold',
  hasPrefix: 'HasPrefix',
  hasSuffix: 'HasSuffix',
  isNil: 'IsNil',
  notNil: 'NotNil',
  has: 'Has',
}

const unwrap = (type) => {
  let current = type
  while (current && (current.kind === 'NON_NULL' || current.kind === 'LIST')) current = current.ofType
  return current ?? { kind: 'SCALAR', name: null }
}

const isListType = (type) => {
  let current = type
  while (current) {
    if (current.kind === 'LIST') return true
    current = current.ofType
  }
  return false
}

const scalarKindFor = (named) => (named.kind === 'ENUM' ? 'enum' : (SCALAR_KINDS[named.name] ?? 'json'))

const readSchema = () => {
  const introspection = JSON.parse(fs.readFileSync(introspectionPath, 'utf8')).__schema
  return {
    query: introspection.types.find((t) => t.name === introspection.queryType.name),
    types: new Map(introspection.types.map((t) => [t.name, t])),
  }
}

const connectionNode = (types, fieldType) => {
  const connection = types.get(unwrap(fieldType).name ?? '')
  if (!connection?.fields) return null

  const edges = connection.fields.find((f) => f.name === 'edges')
  const edgeType = edges && types.get(unwrap(edges.type).name ?? '')
  const node = edgeType?.fields?.find((f) => f.name === 'node')
  const nodeType = node && types.get(unwrap(node.type).name ?? '')

  return nodeType?.fields ? nodeType : null
}

const operatorsFor = (whereFields, fieldName) =>
  Object.entries(OPERATOR_SUFFIXES)
    .filter(([, suffix]) => whereFields.has(`${fieldName}${suffix}`))
    .map(([operator]) => operator)

const STRUCTURAL_WHERE_FIELDS = new Set(['and', 'or', 'not'])

const EDGE_PREDICATE = /^has[A-Z]/

const unexplainedPredicates = (whereFields, nodeType) => {
  const explained = new Set()

  for (const field of nodeType.fields) {
    for (const suffix of Object.values(OPERATOR_SUFFIXES)) explained.add(`${field.name}${suffix}`)
  }

  return [...whereFields].filter((name) => !explained.has(name) && !STRUCTURAL_WHERE_FIELDS.has(name) && !EDGE_PREDICATE.test(name))
}

const buildFields = (nodeType, whereFields, enums) => {
  const fields = []

  for (const field of nodeType.fields) {
    if (EXCLUDED_FIELDS.includes(field.name) || SENSITIVE_FIELDS.includes(field.name)) continue

    const named = unwrap(field.type)
    if (named.kind !== 'SCALAR' && named.kind !== 'ENUM') continue

    const kind = scalarKindFor(named)
    if (kind === 'enum' && named.name) {
      const enumType = enums.source.get(named.name)
      if (enumType?.enumValues)
        enums.used.set(
          named.name,
          enumType.enumValues.map((v) => v.name),
        )
    }

    fields.push({
      name: field.name,
      kind,
      list: isListType(field.type),
      enumName: kind === 'enum' ? named.name : undefined,
      operators: operatorsFor(whereFields, field.name),
    })
  }

  return fields
}

const buildEdges = (types, nodeType, edgeTypes, enums) => {
  const edges = []

  for (const field of nodeType.fields) {
    if (EXCLUDED_FIELDS.includes(field.name) || EXCLUDED_ASSOCIATIONS.includes(field.name)) continue

    const named = unwrap(field.type)
    if (named.kind !== 'OBJECT' || !named.name) continue

    const connectionTarget = connectionNode(types, field.type)
    if (!connectionTarget && named.name.endsWith('Connection')) continue

    const target = connectionTarget ?? types.get(named.name)
    if (!target?.fields || SENSITIVE_EDGE_TARGETS.includes(target.name)) continue

    const connection = connectionTarget !== null

    if (!edgeTypes.has(target.name)) {
      edgeTypes.set(target.name, buildFields(target, new Set(), enums))
    }

    edges.push({ name: field.name, target: target.name, connection, list: connection || isListType(field.type) })
  }

  return edges.sort((a, b) => a.name.localeCompare(b.name))
}

const defaultFieldsFor = (fields) => {
  const names = new Set(fields.map((f) => f.name))
  const defaults = DISPLAY_FIELD_ORDER.filter((name) => names.has(name)).slice(0, 4)
  return defaults.length > 0 ? defaults : fields.slice(0, 3).map((f) => f.name)
}

const buildEntities = (types, query, edgeTypes, enums, unknownPredicates, objectTypes) => {
  const entities = []

  for (const field of query.fields) {
    const nodeType = connectionNode(types, field.type)
    if (!nodeType) continue

    if (field.name.toLowerCase() !== pluralizeTypeName(nodeType.name).toLowerCase()) continue
    if (isExcludedType(nodeType.name)) continue
    if (!nodeType.fields.some((f) => f.name === OWNER_FIELD)) continue

    const objectType = objectTypes.get(nodeType.name.toLowerCase())
    if (!objectType) continue

    const whereArg = field.args.find((a) => a.name === 'where')
    const whereType = whereArg && types.get(unwrap(whereArg.type).name ?? '')
    if (!whereType?.inputFields) continue

    const whereFields = new Set(whereType.inputFields.map((f) => f.name))
    const fields = buildFields(nodeType, whereFields, enums)
    if (fields.length === 0) continue

    for (const predicate of unexplainedPredicates(whereFields, nodeType)) unknownPredicates.add(`${whereType.name}.${predicate}`)

    entities.push({
      queryName: field.name,
      typeName: nodeType.name,
      objectType,
      whereTypeName: whereType.name,
      fields,
      edges: buildEdges(types, nodeType, edgeTypes, enums),
      defaultFields: defaultFieldsFor(fields),
    })
  }

  return entities.sort((a, b) => a.queryName.localeCompare(b.queryName))
}

const createOperatorSets = (entities) => {
  const signatures = new Set()

  for (const entity of entities) {
    for (const field of entity.fields) {
      if (field.operators.length > 0) signatures.add(field.operators.join(','))
    }
  }

  const sets = [...signatures].sort().map((signature) => signature.split(','))
  const indexBySignature = new Map(sets.map((set, index) => [set.join(','), index]))

  return {
    sets,
    indexOf: (operators) => (operators.length === 0 ? null : (indexBySignature.get(operators.join(',')) ?? null)),
  }
}

const serializeField = (field, operatorSets) => {
  const parts = [`name: ${JSON.stringify(field.name)}`, `kind: ${JSON.stringify(field.kind)}`]
  if (field.list) parts.push('list: true')
  if (field.enumName) parts.push(`enumName: ${JSON.stringify(field.enumName)}`)

  const operatorIndex = operatorSets.indexOf(field.operators ?? [])
  if (operatorIndex !== null) parts.push(`operatorSet: ${operatorIndex}`)

  return `{ ${parts.join(', ')} }`
}

const serializeEdge = (edge) => {
  const parts = [`name: ${JSON.stringify(edge.name)}`, `target: ${JSON.stringify(edge.target)}`]
  if (edge.connection) parts.push('connection: true')
  if (edge.list) parts.push('list: true')
  return `{ ${parts.join(', ')} }`
}

const generate = () => {
  const { query, types } = readSchema()
  const enums = { source: types, used: new Map() }
  const edgeTypes = new Map()
  const unknownPredicates = new Set()
  const entities = buildEntities(types, query, edgeTypes, enums, unknownPredicates, readObjectTypes())
  const operatorSets = createOperatorSets(entities)

  const entityLines = entities.flatMap((entity) => [
    '  {',
    `    queryName: ${JSON.stringify(entity.queryName)},`,
    `    typeName: ${JSON.stringify(entity.typeName)},`,
    `    objectType: ObjectTypes.${entity.objectType},`,
    `    whereTypeName: ${JSON.stringify(entity.whereTypeName)},`,
    `    defaultFields: [${entity.defaultFields.map((f) => JSON.stringify(f)).join(', ')}],`,
    `    fields: [${entity.fields.map((f) => serializeField(f, operatorSets)).join(', ')}],`,
    `    edges: [${entity.edges.map(serializeEdge).join(', ')}],`,
    '  },',
  ])

  const entityTypeNames = new Set(entities.map((entity) => entity.typeName))

  const edgeFieldLines = [...edgeTypes.entries()]
    .filter(([name]) => !entityTypeNames.has(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, fields]) => `  ${name}: [${fields.map((f) => serializeField(f, operatorSets)).join(', ')}],`)

  const lines = [
    '/* eslint-disable */',
    '// This file is auto-generated. Do not edit manually.',
    '',
    "import { ObjectTypes } from './type-names'",
    '',
    "export type TReportFieldKind = 'id' | 'string' | 'int' | 'float' | 'boolean' | 'time' | 'enum' | 'json'",
    '',
    `export type TReportOperator = ${Object.keys(OPERATOR_SUFFIXES)
      .map((o) => `'${o}'`)
      .join(' | ')}`,
    '',
    'export const REPORT_OPERATOR_SUFFIX: Record<TReportOperator, string> = {',
    ...Object.entries(OPERATOR_SUFFIXES).map(([operator, suffix]) => `  ${operator}: '${suffix}',`),
    '}',
    '',
    'export interface TReportField {',
    '  name: string',
    '  kind: TReportFieldKind',
    '  list?: boolean',
    '  enumName?: string',
    '  operatorSet?: number',
    '}',
    '',
    'export interface TReportEdge {',
    '  name: string',
    '  target: string',
    '  connection?: boolean',
    '  list?: boolean',
    '}',
    '',
    'export interface TReportEntity {',
    '  queryName: string',
    '  typeName: string',
    '  objectType: ObjectTypes',
    '  whereTypeName: string',
    '  defaultFields: string[]',
    '  fields: TReportField[]',
    '  edges: TReportEdge[]',
    '}',
    '',
    'export const REPORT_OPERATOR_SETS: TReportOperator[][] = [',
    ...operatorSets.sets.map((set) => `  [${set.map((o) => `'${o}'`).join(', ')}],`),
    ']',
    '',
    'export const REPORT_ENUM_VALUES: Record<string, string[]> = {',
    ...[...enums.used.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, values]) => `  ${name}: [${values.map((v) => JSON.stringify(v)).join(', ')}],`),
    '}',
    '',
    'export const REPORT_EDGE_FIELDS: Record<string, TReportField[]> = {',
    ...edgeFieldLines,
    '}',
    '',
    'export const REPORT_ENTITIES: TReportEntity[] = [',
    ...entityLines,
    ']',
    '',
  ]

  fs.writeFileSync(outputPath, lines.join('\n'))

  console.log(`generated ${entities.length} report entities, ${edgeTypes.size} edge types, ${enums.used.size} enums and ${operatorSets.sets.length} operator sets to ${outputPath}`)

  if (unknownPredicates.size > 0) {
    console.warn(`report schema: ${unknownPredicates.size} where input predicates map to no schema field or known operator suffix, so they are unreachable in the report builder`)
    console.warn(`  ${[...unknownPredicates].slice(0, 10).join(', ')}`)
  }
}

generate()

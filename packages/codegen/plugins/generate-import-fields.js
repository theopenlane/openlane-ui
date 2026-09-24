const fs = require('fs')
const path = require('path')
const { parse } = require('graphql')

const introspectionPath = path.join(__dirname, '..', 'src', 'introspectionschema.json')
const outputPath = path.join(__dirname, '..', 'src', 'import-fields.generated.ts')
const typeNamesPath = path.join(__dirname, '..', 'src', 'type-names.ts')
const sdlPath = path.join(__dirname, '..', 'src', 'schema.graphql')

const ADMIN_ONLY_DIRECTIVE = 'readOnly'
const TIMESTAMP_SCALARS = new Set(['Time'])
const INTEGER_SCALARS = new Set(['Int'])

const BULK_CSV_PREFIX = 'createBulkCSV'

const SCALAR_KIND_BY_NAME = {
  String: 'string',
  URL: 'string',
  Email: 'string',
  ID: 'id',
  UUID: 'id',
  Boolean: 'boolean',
  Int: 'number',
  Float: 'number',
  Decimal: 'number',
  DateTime: 'date',
  Date: 'date',
  Time: 'date',
}

const SKIPPED_SCALARS = new Set(['Upload'])

const byCodeUnit = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

const raw = JSON.parse(fs.readFileSync(introspectionPath, 'utf8'))
const schema = raw.__schema || raw
const typesByName = new Map(schema.types.map((type) => [type.name, type]))

const unwrap = (typeRef) => {
  let current = typeRef
  let list = false
  while (current && (current.kind === 'NON_NULL' || current.kind === 'LIST')) {
    if (current.kind === 'LIST') list = true
    current = current.ofType
  }
  return { kind: current ? current.kind : null, name: current ? current.name : null, list }
}

const kindOf = ({ kind, name }) => {
  if (kind === 'ENUM') return 'enum'
  if (kind === 'INPUT_OBJECT') return 'object'
  if (kind === 'SCALAR') return SCALAR_KIND_BY_NAME[name] || 'json'
  return null
}

const mutationType = typesByName.get((schema.mutationType && schema.mutationType.name) || 'Mutation')
if (!mutationType) throw new Error('introspection schema has no Mutation type')

const entities = mutationType.fields
  .filter((field) => field.name.startsWith(BULK_CSV_PREFIX))
  .map((field) => field.name.slice(BULK_CSV_PREFIX.length))
  .sort(byCodeUnit)

const missingInputs = entities.filter((entity) => !typesByName.has(`Create${entity}Input`))
if (missingInputs.length > 0) throw new Error(`createBulkCSV mutations without a Create<X>Input: ${missingInputs.join(', ')}`)

const quote = (value) => JSON.stringify(value)

const readSdl = () => {
  if (!fs.existsSync(sdlPath)) throw new Error(`${path.relative(process.cwd(), sdlPath)} is missing; run codegen (or fetch the client schema SDL) first`)

  const adminOnly = new Map()
  const enumValuesByName = new Map()
  for (const definition of parse(fs.readFileSync(sdlPath, 'utf8')).definitions) {
    if (definition.kind === 'EnumTypeDefinition') {
      enumValuesByName.set(
        definition.name.value,
        (definition.values || []).map((value) => value.name.value),
      )
      continue
    }
    if (definition.kind !== 'InputObjectTypeDefinition') continue
    const names = (definition.fields || []).filter((field) => (field.directives || []).some((d) => d.name.value === ADMIN_ONLY_DIRECTIVE)).map((field) => field.name.value)
    if (names.length > 0) adminOnly.set(definition.name.value, new Set(names))
  }

  if (adminOnly.size === 0) throw new Error(`no @${ADMIN_ONLY_DIRECTIVE} input fields found in the SDL; was it emitted without directives?`)
  return { adminOnly, enumValuesByName }
}

const { adminOnly: adminOnlyByInput, enumValuesByName } = readSdl()

const readObjectTypeValues = () => {
  const block = fs.readFileSync(typeNamesPath, 'utf8').match(/export enum ObjectTypes \{([\s\S]*?)\n\}/)
  if (!block) throw new Error('could not find the ObjectTypes enum in type-names.ts')
  return new Map([...block[1].matchAll(/^\s*\w+ = '([^']+)',/gm)].map(([, value]) => [value.toLowerCase(), value]))
}

const objectTypeValueByLowerName = readObjectTypeValues()

const enumValuesOf = (name) => {
  const values = enumValuesByName.get(name)
  if (!values) throw new Error(`enum ${name} is missing from the SDL`)
  return values
}

const renderField = (field, adminOnlyFields) => {
  const leaf = unwrap(field.type)
  if (leaf.kind === 'SCALAR' && SKIPPED_SCALARS.has(leaf.name)) return null

  const kind = kindOf(leaf)
  if (!kind) return null

  const parts = [`kind: ${quote(kind)}`]
  if (leaf.list) parts.push('list: true')
  if (kind === 'enum') parts.push(`enumValues: ${quote(enumValuesOf(leaf.name))}`)
  if (INTEGER_SCALARS.has(leaf.name)) parts.push('integer: true')
  if (TIMESTAMP_SCALARS.has(leaf.name)) parts.push('timestamp: true')
  if (adminOnlyFields && adminOnlyFields.has(field.name)) parts.push('adminOnly: true')
  const description = typeof field.description === 'string' ? field.description.trim() : ''
  if (description) parts.push(`description: ${quote(description)}`)

  return `    ${quote(field.name)}: { ${parts.join(', ')} },`
}

const blocks = entities.map((entity) => {
  const inputName = `Create${entity}Input`
  const input = typesByName.get(inputName)
  const fields = [...(input.inputFields || [])]
    .sort((a, b) => byCodeUnit(a.name, b.name))
    .map((field) => renderField(field, adminOnlyByInput.get(inputName)))
    .filter(Boolean)
  return `  ${quote(objectTypeValueByLowerName.get(entity.toLowerCase()) ?? entity)}: {\n${fields.join('\n')}\n  },`
})

const output = `/* eslint-disable */
// This file is auto-generated by plugins/generate-import-fields.js. Do not edit manually.

export type ImportFieldKind = 'string' | 'id' | 'number' | 'boolean' | 'date' | 'enum' | 'json' | 'object'

export type ImportFieldMeta = {
  kind: ImportFieldKind
  list?: true
  enumValues?: readonly string[]
  integer?: true
  timestamp?: true
  adminOnly?: true
  description?: string
}

export const IMPORT_FIELDS: Readonly<Record<string, Readonly<Record<string, ImportFieldMeta>>>> = {
${blocks.join('\n')}
}
`

fs.writeFileSync(outputPath, output)
console.log(`generate-import-fields: wrote ${entities.length} entities to ${path.relative(process.cwd(), outputPath)}`)

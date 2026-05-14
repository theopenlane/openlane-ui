// Codegen plugin: generates two files from introspectionschema.json.
//
//   1. packages/codegen/src/merge-fields.generated.ts
//      Per GraphQL Object that implements `Node` AND has an `Update<Type>Input`,
//      emits every scalar/enum (or list-of) field that appears on both. That
//      intersection is the authoritative set of fields a merge sheet can
//      present — schema-derived, no hand-maintained allowlist.
//
//   2. packages/codegen/src/schema-enums.generated.ts
//      Re-exports every GraphQL enum from schema.ts as a typed registry
//      (`SCHEMA_ENUMS`) with `KnownEnumName = keyof typeof SCHEMA_ENUMS`.
//      Merge-field descriptors reference enums by name; typing `enumName` as
//      `KnownEnumName` enforces (at compile time) that both files agree.
//
// The descriptor uses a discriminated `kind` (mapped once at codegen time)
// rather than a stringly-typed `scalarName`. Top-level non-null and list-item
// non-null information is preserved alongside `list` so future consumers
// (e.g. required-field validation) don't have to re-walk introspection.

const fs = require('fs')
const path = require('path')

const introspectionPath = path.join(__dirname, '..', 'src', 'introspectionschema.json')
const mergeFieldsOutputPath = path.join(__dirname, '..', 'src', 'merge-fields.generated.ts')
const schemaEnumsOutputPath = path.join(__dirname, '..', 'src', 'schema-enums.generated.ts')

const raw = JSON.parse(fs.readFileSync(introspectionPath, 'utf8'))
const schema = raw.__schema || raw

const SCALAR_KIND_BY_NAME = {
  String: 'string',
  ID: 'id',
  Boolean: 'boolean',
  Int: 'number',
  Float: 'number',
  DateTime: 'date',
  Date: 'date',
  Time: 'date',
  JSON: 'json',
  Map: 'json',
  Any: 'json',
  URL: 'string',
  Email: 'string',
  // Backend custom scalars that serialise as structured JSON. Surfaced via the
  // codegen warning the first time they appear; group them here so the merge
  // sheet renders them as a JSON map rather than free-text.
  Address: 'json',
  AssessmentMethod: 'json',
  AssessmentObjective: 'json',
  CredentialSet: 'json',
  EvidenceRequests: 'json',
  ExampleEvidence: 'json',
  ExportMetadata: 'json',
  ImplementationGuidance: 'json',
  JobConfiguration: 'json',
  Reference: 'json',
  RiskThresholdsConfig: 'json',
  TestingProcedures: 'json',
  VendorScoringQuestionsConfig: 'json',
  WorkflowDefinitionDocument: 'json',
}

const SKIPPED_SCALARS = new Set(['Upload'])
const unknownScalars = new Set()

const unwrapType = (t) => {
  let current = t
  let nonNull = false
  let list = false
  let listItemNonNull = false

  if (current && current.kind === 'NON_NULL') {
    nonNull = true
    current = current.ofType
  }
  if (current && current.kind === 'LIST') {
    list = true
    current = current.ofType
    if (current && current.kind === 'NON_NULL') {
      listItemNonNull = true
      current = current.ofType
    }
  }
  // Collapse any further wrappers defensively (nested lists / unusual schemas).
  while (current && (current.kind === 'LIST' || current.kind === 'NON_NULL')) {
    if (current.kind === 'LIST') list = true
    current = current.ofType
  }

  return { leafKind: current ? current.kind : null, leafName: current ? current.name : null, list, nonNull, listItemNonNull }
}

const implementsNode = (type) => Array.isArray(type.interfaces) && type.interfaces.some((i) => i.name === 'Node')

// graphql-codegen lowercases consecutive uppercase runs when generating TS
// names (`APIToken` → `ApiToken`, `MFA` → `Mfa`). The introspection schema
// preserves the GraphQL casing, so we apply the same PascalCase transform to
// derive the actual exported identifier in schema.ts.
const toTsPascalCase = (s) =>
  s
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')

// Walk every ENUM the schema declares (skip GraphQL built-in introspection
// types prefixed with `__`). This becomes SCHEMA_ENUMS — a generic registry
// usable beyond merge-records. Both the registry key and the imported binding
// use the TS-side PascalCase, so consumers reference the same names they
// would when importing the enum directly.
const enumNames = []
for (const type of schema.types) {
  if (type.kind !== 'ENUM') continue
  if (typeof type.name !== 'string' || type.name.startsWith('__')) continue
  enumNames.push(toTsPascalCase(type.name))
}
enumNames.sort()

// Build the set of writable field names for every Update*Input. The merge
// sheet only surfaces fields that appear on BOTH the readable Object type AND
// its corresponding update input — otherwise a user could pick a value during
// merge that the backend silently drops at mutation time.
const writableFieldsByInputName = new Map()
for (const type of schema.types) {
  if (type.kind !== 'INPUT_OBJECT') continue
  if (!Array.isArray(type.inputFields)) continue
  writableFieldsByInputName.set(type.name, new Set(type.inputFields.map((f) => f.name)))
}

const fieldsByType = {}
const typeNames = []

for (const type of schema.types) {
  if (type.kind !== 'OBJECT') continue
  if (!implementsNode(type)) continue
  if (!Array.isArray(type.fields)) continue

  const writableFields = writableFieldsByInputName.get(`Update${type.name}Input`)
  if (!writableFields) continue

  const descriptors = []
  for (const field of type.fields) {
    if (Array.isArray(field.args) && field.args.length > 0) continue
    if (!writableFields.has(field.name)) continue

    const { leafKind, leafName, list, nonNull, listItemNonNull } = unwrapType(field.type)
    if (leafKind !== 'SCALAR' && leafKind !== 'ENUM') continue
    if (leafKind === 'SCALAR' && SKIPPED_SCALARS.has(leafName)) continue

    let kind
    let enumName
    if (leafKind === 'ENUM') {
      kind = 'enum'
      enumName = toTsPascalCase(leafName)
    } else {
      kind = SCALAR_KIND_BY_NAME[leafName]
      if (!kind) {
        unknownScalars.add(leafName)
        kind = 'string'
      }
    }

    descriptors.push({ name: field.name, kind, list, nonNull, listItemNonNull, enumName })
  }

  if (descriptors.length === 0) continue
  descriptors.sort((a, b) => a.name.localeCompare(b.name))
  fieldsByType[type.name] = descriptors
  typeNames.push(type.name)
}

typeNames.sort()

// ─── schema-enums.generated.ts ────────────────────────────────────────────────

const enumsLines = []
enumsLines.push('/* eslint-disable */')
enumsLines.push('// This file is auto-generated by plugins/generate-merge-fields.js. Do not edit manually.')
enumsLines.push('// Source: introspectionschema.json (regenerated by `task codegen:codegen`).')
enumsLines.push('//')
enumsLines.push('// Generic registry of every GraphQL enum in the schema. Keyed by GraphQL type')
enumsLines.push("// name (e.g. 'AssetAssetType') so callers can derive options dynamically without")
enumsLines.push('// hand-maintaining a parallel list. `KnownEnumName` is the literal union of')
enumsLines.push('// registry keys; cross-referencing it from merge-fields.generated.ts gives a')
enumsLines.push('// compile-time guarantee that both files agree on the set of enums.')
enumsLines.push('')
if (enumNames.length === 0) {
  enumsLines.push('export const SCHEMA_ENUMS = {} as const')
  enumsLines.push('export type KnownEnumName = never')
} else {
  enumsLines.push('import {')
  for (const name of enumNames) {
    enumsLines.push(`  ${name},`)
  }
  enumsLines.push("} from './schema'")
  enumsLines.push('')
  enumsLines.push('export const SCHEMA_ENUMS = {')
  for (const name of enumNames) {
    enumsLines.push(`  ${name},`)
  }
  enumsLines.push('} as const')
  enumsLines.push('')
  enumsLines.push('export type KnownEnumName = keyof typeof SCHEMA_ENUMS')
}
enumsLines.push('')

fs.writeFileSync(schemaEnumsOutputPath, enumsLines.join('\n'))

// ─── merge-fields.generated.ts ────────────────────────────────────────────────

const knownEnumSet = new Set(enumNames)
const stringifyDescriptor = (d) => {
  const parts = [`name: ${JSON.stringify(d.name)}`, `kind: ${JSON.stringify(d.kind)}`, `list: ${d.list}`, `nonNull: ${d.nonNull}`, `listItemNonNull: ${d.listItemNonNull}`]
  if (d.enumName) {
    if (!knownEnumSet.has(d.enumName)) {
      throw new Error(
        `[generate-merge-fields] enum '${d.enumName}' referenced by descriptor '${d.name}' is missing from SCHEMA_ENUMS. ` + 'Investigate why it was not collected from the introspection schema.',
      )
    }
    parts.push(`enumName: ${JSON.stringify(d.enumName)}`)
  }
  return `{ ${parts.join(', ')} }`
}

const lines = []
lines.push('/* eslint-disable */')
lines.push('// This file is auto-generated by plugins/generate-merge-fields.js. Do not edit manually.')
lines.push('// Source: introspectionschema.json (regenerated by `task codegen:codegen`).')
lines.push('//')
lines.push('// For each GraphQL type that implements Node AND has a corresponding Update*Input,')
lines.push('// emits every scalar/enum (or list-of) field that appears on both the readable Object')
lines.push('// type and its update input. That intersection is the authoritative set of fields a')
lines.push('// merge sheet can present.')
lines.push('')
lines.push("import type { KnownEnumName } from './schema-enums.generated'")
lines.push('')
lines.push("export type MergeFieldKind = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'id' | 'enum'")
lines.push('')
lines.push('export type MergeFieldDescriptor = {')
lines.push('  readonly name: string')
lines.push('  readonly kind: MergeFieldKind')
lines.push('  readonly list: boolean')
lines.push('  readonly nonNull: boolean')
lines.push('  readonly listItemNonNull: boolean')
lines.push('  readonly enumName?: KnownEnumName')
lines.push('}')
lines.push('')

if (typeNames.length === 0) {
  lines.push('export type MergeableTypeName = never')
} else {
  lines.push('export type MergeableTypeName =')
  for (const name of typeNames) {
    lines.push(`  | ${JSON.stringify(name)}`)
  }
}
lines.push('')
lines.push('export const MERGEABLE_FIELDS_BY_TYPE = {')
for (const typeName of typeNames) {
  const descriptors = fieldsByType[typeName]
  lines.push(`  ${JSON.stringify(typeName)}: [`)
  for (const d of descriptors) {
    lines.push(`    ${stringifyDescriptor(d)},`)
  }
  lines.push('  ],')
}
lines.push('} as const satisfies Record<MergeableTypeName, readonly MergeFieldDescriptor[]>')
lines.push('')
lines.push("export type MergeableFieldNamesFor<T extends MergeableTypeName> = (typeof MERGEABLE_FIELDS_BY_TYPE)[T][number]['name']")
lines.push('')

fs.writeFileSync(mergeFieldsOutputPath, lines.join('\n'))

if (unknownScalars.size > 0) {
  console.warn(`[generate-merge-fields] Unknown scalar(s) defaulted to 'string': ${[...unknownScalars].sort().join(', ')}. ` + 'Add a mapping in SCALAR_KIND_BY_NAME if a more specific kind applies.')
}
console.log(`Generated merge-fields.generated.ts (${typeNames.length} types) and schema-enums.generated.ts (${enumNames.length} enums)`)

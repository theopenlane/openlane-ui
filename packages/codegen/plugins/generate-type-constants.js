const fs = require('fs')
const path = require('path')
const { toHumanLabel, toEnumKey } = require('./lib')

const schemaPath = path.join(__dirname, '..', 'src', 'schema.ts')
const outputPath = path.join(__dirname, '..', 'src', 'type-names.ts')
const schemaContent = fs.readFileSync(schemaPath, 'utf8')

const PERMISSIONS_EXCLUDE = [
  // add permission types to exclude here
]

const TASK_EXCLUDE = [
  'WorkflowObjectRef',
  'Note',
  // add task types to exclude here
]

function pluralizeTypeName(name) {
  const lc = name.charAt(0).toLowerCase() + name.slice(1)
  if (lc.endsWith('y')) return lc.slice(0, -1) + 'ies'
  return lc + 's'
}

// Match only interfaces that extend Node
const nodeTypeRegex = /export interface (\w+) extends Node\s*\{[\s\S]*?\n\}/g
const matches = [...schemaContent.matchAll(nodeTypeRegex)]

const nodeTypes = matches.map((m) => ({
  name: m[1],
  body: m[0],
}))

const uniqueEntries = nodeTypes.map((nt) => ({ interfaceName: nt.name, typename: nt.name }))

// Generate Types enum (ALL CAPS keys -> GraphQL type name values)
const typesEnumLines = ['export enum ObjectTypes {', ...uniqueEntries.map(({ typename }) => `  ${toEnumKey(typename)} = '${typename}',`), '}']

// Generate Names enum (ALL CAPS keys -> human-readable labels)
const namesEnumLines = ['export enum ObjectNames {', ...uniqueEntries.map(({ typename }) => `  ${toEnumKey(typename)} = '${toHumanLabel(typename)}',`), '}']

// Find types with editors or viewers
const typesWithPermissions = Array.from(
  new Set(
    nodeTypes.filter(({ body, name }) => !PERMISSIONS_EXCLUDE.includes(name) && (body.includes('editors: GroupConnection') || body.includes('viewers: GroupConnection'))).map(({ name }) => name),
  ),
)

// Generate TypesWithPermissions enum (ALL CAPS keys -> GraphQL type name values)
const permissionsEnumLines = ['export enum TypesWithPermissions {', ...typesWithPermissions.map((name) => `  ${toEnumKey(name)} = '${name}',`), '}']

// Generate Permissions AllQueriesData shape entries
const permissionsEntries = typesWithPermissions.map((name) => {
  const key = pluralizeTypeName(name) // e.g., Control -> controls
  return { key, typeName: name }
})

// Find Task node and extract all Connection edges (use field names)
const taskNode = nodeTypes.find(({ name }) => name === 'Task')
const taskObjectTypes = []
const taskEntries = []

if (taskNode) {
  const connectionRegex = /(\w+): (\w+)Connection/g
  const connectionMatches = [...taskNode.body.matchAll(connectionRegex)]

  const extracted = connectionMatches.map((m) => ({ field: m[1], typeName: m[2] })).filter(({ typeName }) => !TASK_EXCLUDE.includes(typeName))

  const seen = new Set()
  extracted.forEach((e) => {
    const key = `${e.field}:${e.typeName}`
    if (!seen.has(key)) {
      seen.add(key)
      taskEntries.push(e)
      taskObjectTypes.push({
        enumKey: toEnumKey(e.typeName),
        typeName: e.typeName,
        humanLabel: toHumanLabel(e.typeName),
        field: e.field,
      })
    }
  })
}

// Imports: collect PageInfo + all node types used in generated AllQueriesData
const importTypes = new Set()
importTypes.add('PageInfo')
permissionsEntries.forEach((e) => importTypes.add(e.typeName))
taskEntries.forEach((e) => importTypes.add(e.typeName))

const importLine = `import { ${Array.from(importTypes).sort().join(', ')} } from './schema'`

// Build permissions AllQueriesData block
const permissionsBlock = [
  'export type PermissionsAllQueriesData = {',
  ...permissionsEntries.map(({ key, typeName }) => [`  ${key}?: {`, `    edges?: Array<{ node: ${typeName} }>`, `    pageInfo?: PageInfo`, `    totalCount?: number`, `  }`]).flat(),
  '}',
]

// Build task AllQueriesData block using field names
const taskBlock = [
  'export type TaskAllQueriesData = {',
  ...taskEntries.map(({ field, typeName }) => [`  ${field}?: {`, `    edges?: Array<{ node: ${typeName} }>`, `    pageInfo?: PageInfo`, `    totalCount?: number`, `  }`]).flat(),
  '}',
]

// Generate TaskObjectTypes enum
const taskEnumLines = ['export enum TaskObjectTypes {', ...taskObjectTypes.map(({ enumKey, humanLabel }) => `  ${enumKey} = '${humanLabel}',`), '}']

const header = `// This file is auto-generated. Do not edit manually.\n\n`
const output =
  header +
  importLine +
  '\n\n' +
  typesEnumLines.join('\n') +
  '\n\n' +
  namesEnumLines.join('\n') +
  '\n\n' +
  permissionsEnumLines.join('\n') +
  '\n\n' +
  permissionsBlock.join('\n') +
  '\n\n' +
  taskEnumLines.join('\n') +
  '\n\n' +
  taskBlock.join('\n') +
  '\n'

fs.writeFileSync(outputPath, output)
console.log(`Generated Types enum (${uniqueEntries.length}), Names enum (${uniqueEntries.length}), ${typesWithPermissions.length} permission types, and ${taskObjectTypes.length} task object types`)

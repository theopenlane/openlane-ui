const fs = require('fs')
const path = require('path')
const { toHumanLabel, toUpperSnake, getObjectNameFromBody, toKebab, getQueryNameFor } = require('./lib')
const { generatePermissionsSection } = require('./permissions')
const { generateTasksSection } = require('./tasks')

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

// --- Extract node types ---
const nodeTypeRegex = /export interface (\w+) extends Node\s*\{[\s\S]*?\n\}/g
const matches = [...schemaContent.matchAll(nodeTypeRegex)]

const nodeTypes = matches.map((m) => ({
  name: m[1],
  body: m[0],
}))

const uniqueEntries = nodeTypes.map((nt) => ({ interfaceName: nt.name, typename: nt.name }))

// --- Enums: ObjectTypes and ObjectNames ---
const typesEnumLines = ['export enum ObjectTypes {', ...uniqueEntries.map(({ typename }) => `  ${toUpperSnake(typename)} = '${typename}',`), '}']

const namesEnumLines = ['export enum ObjectNames {', ...uniqueEntries.map(({ typename }) => `  ${toUpperSnake(typename)} = '${toHumanLabel(typename)}',`), '}']

// --- Generate Permissions Section ---
const permissionsSection = generatePermissionsSection({
  nodeTypes,
  PERMISSIONS_EXCLUDE,
})

// --- Generate Tasks Section ---
const tasksSection = generateTasksSection({
  nodeTypes,
  TASK_EXCLUDE,
})

// --- Collect all used types for schema import ---
const usedTypes = new Set(['PageInfo'])
if (permissionsSection.permissionsEntries) {
  permissionsSection.permissionsEntries.forEach(({ typeName }) => usedTypes.add(typeName))
}
if (tasksSection.taskEntries) {
  tasksSection.taskEntries.forEach(({ typeName }) => usedTypes.add(typeName))
}
const schemaImportLine = `import { ${Array.from(usedTypes).sort().join(', ')} } from './schema'`

// --- Compose all query imports and deduplicate ---
const allQueryImportLines = [...(permissionsSection.queryImportLines || []), ...(tasksSection.queryImportLines || [])]
const uniqueQueryImportLines = Array.from(new Set(allQueryImportLines.filter(Boolean)))

// --- Compose output ---
const header = `// This file is auto-generated. Do not edit manually.\n\n`
const output =
  header +
  schemaImportLine +
  '\n' +
  (uniqueQueryImportLines.length ? uniqueQueryImportLines.join('\n') + '\n' : '') +
  '\n' +
  typesEnumLines.join('\n') +
  '\n\n' +
  namesEnumLines.join('\n') +
  '\n\n' +
  permissionsSection.permissionsEnumLines.join('\n') +
  '\n\n' +
  permissionsSection.permissionsBlock.join('\n') +
  `\n\n` +
  permissionsSection.objectConfigLines.join('\n') +
  '\n\n' +
  tasksSection.taskEnumLines.join('\n') +
  '\n\n' +
  tasksSection.taskBlock.join('\n') +
  '\n' +
  tasksSection.taskObjectTypeConfigLines.join('\n') +
  '\n'

fs.writeFileSync(outputPath, output)
console.log(
  `Generated Types enum (${uniqueEntries.length}), Names enum (${uniqueEntries.length}), ${permissionsSection.typesWithPermissions.length} permission types, and ${tasksSection.taskObjectTypes.length} task object types`,
)

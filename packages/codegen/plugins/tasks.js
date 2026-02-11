const path = require('path')
const fs = require('fs')
const { toUpperSnake, toHumanLabel, getQueryNameFor, toKebab } = require('./lib')

function generateTasksSection({ nodeTypes, TASK_EXCLUDE }) {
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
          enumKey: toUpperSnake(e.typeName),
          typeName: e.typeName,
          humanLabel: toHumanLabel(e.typeName),
          field: e.field,
        })
      }
    })
  }

  // Generate TaskObjectTypes enum
  const taskEnumLines = ['export enum TaskObjectTypes {', ...taskObjectTypes.map(({ enumKey, humanLabel }) => `  ${enumKey} = '${humanLabel}',`), '}']

  // Build task AllQueriesData block using field names
  const taskBlock = [
    'export type TaskAllQueriesData = {',
    ...taskEntries.map(({ field, typeName }) => [`  ${field}?: {`, `    edges?: Array<{ node: ${typeName} }>`, `    pageInfo?: PageInfo`, `    totalCount?: number`, `  }`]).flat(),
    '}',
  ]

  const taskObjectTypeConfigLines = []
  taskObjectTypeConfigLines.push('// Generated TASK_OBJECT_TYPE_CONFIG')
  taskObjectTypeConfigLines.push('export type TTaskObjectTypeConfig = {')
  taskObjectTypeConfigLines.push('  responseObjectKey: string')
  taskObjectTypeConfigLines.push('  queryDocument: string')
  taskObjectTypeConfigLines.push('  inputName: string')
  taskObjectTypeConfigLines.push('  placeholder: string')
  taskObjectTypeConfigLines.push('  searchAttribute: string')
  taskObjectTypeConfigLines.push('  objectName: string')
  taskObjectTypeConfigLines.push('}')
  taskObjectTypeConfigLines.push('')
  taskObjectTypeConfigLines.push('export const TASK_OBJECT_TYPE_CONFIG: Record<TaskObjectTypes, TTaskObjectTypeConfig> = {')

  // Query imports for tasks
  const queryImports = new Map()

  taskObjectTypes.forEach(({ enumKey, typeName, humanLabel }) => {
    const kebab = toKebab(typeName)
    const queryName = getQueryNameFor(typeName)
    const candidateTs = path.join(__dirname, '..', 'query', `${kebab}.ts`)
    const candidateIndexTs = path.join(__dirname, '..', 'query', `${kebab}`, 'index.ts')
    const hasQuery = fs.existsSync(candidateTs) || fs.existsSync(candidateIndexTs)
    const queryDocRef = hasQuery ? queryName : `''`
    if (hasQuery) queryImports.set(queryName, `@repo/codegen/query/${kebab}`)

    const responseObjectKey = typeName.charAt(0).toLowerCase() + typeName.slice(1)
    const pluralKey = responseObjectKey.endsWith('y') ? responseObjectKey.slice(0, -1) + 'ies' : responseObjectKey + 's'

    const inputName = typeName.charAt(0).toLowerCase() + typeName.slice(1) + 'IDs'
    const placeholder = toHumanLabel(typeName).toLowerCase()
    // searchAttribute logic: prefer refCode, then name, then title
    let searchAttribute = 'nameContainsFold'
    if (/refCode/i.test(typeName)) searchAttribute = 'refCodeContainsFold'
    else if (/title/i.test(typeName)) searchAttribute = 'titleContainsFold'

    let objectName = 'name'
    if (/refCode/i.test(typeName)) objectName = 'refCode'
    else if (/title/i.test(typeName)) objectName = 'title'

    taskObjectTypeConfigLines.push(
      `  [TaskObjectTypes.${enumKey}]: {`,
      `    responseObjectKey: '${pluralKey}',`,
      `    inputName: '${inputName}',`,
      `    placeholder: '${placeholder}',`,
      `    queryDocument: ${queryDocRef},`,
      `    searchAttribute: '${searchAttribute}',`,
      `    objectName: '${objectName}',`,
      '  },',
    )
  })

  taskObjectTypeConfigLines.push('}')
  taskObjectTypeConfigLines.push('')

  // Convert queryImports to import lines
  const queryImportLines = Array.from(queryImports.entries()).map(([queryName, mod]) => `import { ${queryName} } from '${mod}'`)

  return {
    taskEnumLines,
    taskBlock,
    taskObjectTypes,
    taskEntries,
    taskObjectTypeConfigLines,
    queryImportLines,
  }
}

module.exports = { generateTasksSection }

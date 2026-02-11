const path = require('path')
const fs = require('fs')
const { pluralizeTypeName, toUpperSnake, getObjectNameFromBody, toHumanLabel, getQueryNameFor, toKebab } = require('./lib')

function generatePermissionsSection({ nodeTypes, PERMISSIONS_EXCLUDE, schemaImportLine }) {
  // Find types with editors or viewers
  const typesWithPermissions = Array.from(
    new Set(
      nodeTypes.filter(({ body, name }) => !PERMISSIONS_EXCLUDE.includes(name) && (body.includes('editors: GroupConnection') || body.includes('viewers: GroupConnection'))).map(({ name }) => name),
    ),
  )

  // Generate TypesWithPermissions enum (ALL CAPS keys -> GraphQL type name values)
  const permissionsEnumLines = ['export enum TypesWithPermissions {', ...typesWithPermissions.map((name) => `  ${toUpperSnake(name)} = '${name}',`), '}']

  // Generate Permissions AllQueriesData shape entries
  const permissionsEntries = typesWithPermissions.map((name) => {
    const key = pluralizeTypeName(name) // e.g., Control -> controls
    return { key, typeName: name }
  })

  // Build permissions AllQueriesData block
  const permissionsBlock = [
    'export type PermissionsAllQueriesData = {',
    ...permissionsEntries.map(({ key, typeName }) => [`  ${key}?: {`, `    edges?: Array<{ node: ${typeName} }>`, `    pageInfo?: PageInfo`, `    totalCount?: number`, `  }`]).flat(),
    '}',
  ]

  // Generate Object Permissions Config
  const objectConfigLines = []
  objectConfigLines.push('// Generated OBJECT_TYPE_PERMISSIONS_CONFIG')
  objectConfigLines.push('export type ObjectPermissionConfig = {')
  objectConfigLines.push('  roleOptions: string[]')
  objectConfigLines.push('  responseObjectKey: keyof PermissionsAllQueriesData')
  objectConfigLines.push('  queryDocument: string')
  objectConfigLines.push('  objectName: string')
  objectConfigLines.push('  searchAttribute: string')
  objectConfigLines.push('  inputPlaceholder: string')
  objectConfigLines.push('  excludeViewersInFilter?: boolean')
  objectConfigLines.push('  extraTableColumns?: any[]')
  objectConfigLines.push('}')
  objectConfigLines.push('')
  objectConfigLines.push('export const OBJECT_TYPE_PERMISSIONS_CONFIG: Record<TypesWithPermissions, ObjectPermissionConfig> = {')

  // Query imports
  const queryImports = new Map()
  const usedQueryNames = new Set()
  const usedQueryKebabs = new Map() // queryName -> kebab

  typesWithPermissions.forEach((typeName) => {
    const node = nodeTypes.find((n) => n.name === typeName)
    const body = node ? node.body : ''
    const roleOptions = []
    if (/\bviewers\b/.test(body)) roleOptions.push('View')
    if (/\beditors\b/.test(body)) roleOptions.push('Edit')
    if (/\bblockedGroups\b/.test(body)) roleOptions.push('Blocked')

    const orderedRoles = ['View', 'Edit', 'Blocked'].filter((r) => roleOptions.includes(r))
    const roleOptionsString = `[${orderedRoles.map((r) => `'${r}'`).join(', ')}]`

    const responseKey = pluralizeTypeName(typeName)
    const kebab = toKebab(typeName)
    const queryName = getQueryNameFor(typeName)
    const candidateTs = path.join(__dirname, '..', 'query', `${kebab}.ts`)
    const candidateIndexTs = path.join(__dirname, '..', 'query', `${kebab}`, 'index.ts')
    const hasQuery = fs.existsSync(candidateTs) || fs.existsSync(candidateIndexTs)
    const queryDocRef = hasQuery ? queryName : `''`

    // Only track queries that are actually referenced in the config
    if (hasQuery && queryDocRef !== `''`) {
      usedQueryNames.add(queryName)
      usedQueryKebabs.set(queryName, kebab)
    }

    const objectName = getObjectNameFromBody(body)
    const searchAttribute = `${objectName}ContainsFold`
    const inputPlaceholder = toHumanLabel(objectName).toLowerCase()
    const excludeViewersInFilter = !orderedRoles.includes('View')

    let extraCols = 'undefined'
    if (typeName === 'Control') {
      extraCols = `[
        {
          header: 'Reference Framework',
          accessorKey: 'referenceFramework',
          size: 200,
          minSize: 200,
          maxSize: 200,
        },
      ]`
    }

    objectConfigLines.push(
      `  [TypesWithPermissions.${toUpperSnake(typeName)}]: {`,
      `    roleOptions: ${roleOptionsString},`,
      `    responseObjectKey: '${responseKey}',`,
      `    queryDocument: ${queryDocRef},`,
      `    objectName: '${objectName}',`,
      `    searchAttribute: '${searchAttribute}',`,
      `    inputPlaceholder: '${inputPlaceholder}',`,
      `    excludeViewersInFilter: ${excludeViewersInFilter},`,
      `    extraTableColumns: ${extraCols},`,
      '  },',
    )
  })

  // Only import queries that are actually referenced in the config
  usedQueryNames.forEach((queryName) => {
    const kebab = usedQueryKebabs.get(queryName)
    queryImports.set(queryName, `@repo/codegen/query/${kebab}`)
  })

  objectConfigLines.push('}')
  objectConfigLines.push('')

  // Convert queryImports to import lines
  const queryImportLines = Array.from(queryImports.entries()).map(([queryName, mod]) => `import { ${queryName} } from '${mod}'`)

  return {
    permissionsEnumLines,
    permissionsBlock,
    objectConfigLines,
    queryImportLines,
    typesWithPermissions,
    permissionsEntries,
  }
}

module.exports = { generatePermissionsSection }

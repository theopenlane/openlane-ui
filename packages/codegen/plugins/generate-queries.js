const fs = require('fs')
const path = require('path')
const { toKebab, toUpperSnake, pluralizeTypeName } = require('./lib')

const schemaPath = path.join(__dirname, '..', 'src', 'schema.ts')
const queryOutputDir = path.join(__dirname, '..', 'query')
const schemaContent = fs.readFileSync(schemaPath, 'utf8')

// Types to exclude from query generation
const EXCLUDED_TYPES = [
  'Notification',
  'Note',
  'MappableDomain',
  'CustomDomain',
  'DnsVerification',
  'Event',
  'File',
  'GroupMembership',
  'ProgramMembership',
  'Hush',
  'Invite',
  'OrgMembership',
  'OrgSubscription',
  'Webauthn',
  'ApiToken',
  'JobRunnerToken',
  'TrustCenterSetting',
  'UserSetting',
  'TrustCenterWatermarkConfig',
  'PersonalAccessToken',
  'OrganizationSetting',
  'GroupPermission',
  'DocumentData',
]

// Fields to exclude from all queries
const EXCLUDED_FIELDS = ['deletedAt', 'deletedBy', 'systemInternalID', 'internalNotes', 'ownerID', '__typename', 'owner']

// Edge types to exclude from associations
const EXCLUDED_ASSOCIATIONS = ['groups', 'editors', 'viewers', 'blockedGroups', 'user', 'owner', 'organization']

// Extract all Node interfaces
const nodeTypeRegex = /export interface (\w+) extends Node\s*\{([\s\S]*?)\n\}/g
const matches = [...schemaContent.matchAll(nodeTypeRegex)]

const nodeTypes = matches
  .map((m) => {
    const name = m[1]
    const gqlNameMatch = m[2].match(/__typename\?\s*:\s*'(\w+)'/)
    return {
      name,
      gqlName: gqlNameMatch ? gqlNameMatch[1] : name,
      body: m[0],
      fields: extractFields(m[2]),
    }
  })
  .filter((nt) => !EXCLUDED_TYPES.includes(nt.name))

function isScalarField(fieldType) {
  // Matches Scalars['TYPE']['output'] or Maybe<Scalars['TYPE']['output']>
  return /^Scalars\['[A-Za-z]+'\]\['output'\]$/.test(fieldType) || /^Maybe<Scalars\['[A-Za-z]+'\]\['output'\]>$/.test(fieldType)
}

function extractFields(bodyContent) {
  const fields = new Set()
  const lines = bodyContent.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) continue
    // Match: fieldName?: Type or fieldName: Type
    const fieldMatch = trimmed.match(/^(\w+)\??:\s*([^;]+);?/)
    if (fieldMatch) {
      const [, fieldName, fieldType] = fieldMatch
      if (EXCLUDED_FIELDS.includes(fieldName)) continue
      if (isScalarField(fieldType)) {
        fields.add(fieldName)
      }
    }
  }
  // Always include 'id' if present in the body
  if (/id\s*:\s*Scalars\['ID'\]\['output'\]/.test(bodyContent)) {
    fields.add('id')
  }
  return Array.from(fields).map((name) => ({
    name,
    type: null, // type not needed for scalar field list
    isEdge: false,
  }))
}

function getScalarFields(fields) {
  return fields.filter((f) => !f.isEdge).map((f) => f.name)
}

function getEdgeFields(fields) {
  return fields.filter((f) => f.isEdge && !EXCLUDED_ASSOCIATIONS.includes(f.name))
}

function getAssociationFields(typeName, edgeName) {
  // Common fields for most edges
  let fields = ['id']

  // Add name-like field
  if (typeName === 'Control' || edgeName.toLowerCase().includes('control')) {
    fields.push('refCode', 'description', 'displayID', 'referenceFramework')
  } else if (hasField(typeName, 'name')) {
    fields.push('name')
  } else if (hasField(typeName, 'refCode')) {
    fields.push('refCode')
  } else if (hasField(typeName, 'title')) {
    fields.push('title')
  }

  // Add description-like field
  if (!fields.includes('description')) {
    if (hasField(typeName, 'description')) {
      fields.push('description')
    } else if (hasField(typeName, 'details')) {
      fields.push('details')
    }
  }

  return fields
}

function hasField(typeName, fieldName) {
  const type = nodeTypes.find((t) => t.name === typeName)
  return type?.fields.some((f) => f.name === fieldName) || false
}

function generateQueryFile(nodeType) {
  const { name, gqlName, fields } = nodeType
  const lowerName = name.charAt(0).toLowerCase() + name.slice(1)
  const pluralName = pluralizeTypeName(name)
  const upperName = toUpperSnake(name)
  const upperPluralName = toUpperSnake(pluralName)
  const scalarFields = getScalarFields(fields)
  const edgeFields = getEdgeFields(fields)

  const fieldsList = scalarFields.length > 0 ? scalarFields.map((f) => `          ${f}`).join('\n') : '          id'

  const fieldsGetList = scalarFields.length > 0 ? scalarFields.map((f) => `      ${f}`).join('\n') : '      id'

  const queries = []

  queries.push(`export const GET_ALL_${upperPluralName} = gql\`
  query ${name}sWithFilter($where: ${gqlName}WhereInput, $orderBy: [${gqlName}Order!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    ${pluralName}(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
${fieldsList}
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
\``)

  queries.push(`export const ${upperName} = gql\`
  query ${gqlName}($${lowerName}Id: ID!) {
    ${lowerName}(id: $${lowerName}Id) {
${fieldsGetList}
    }
  }
\``)

  queries.push(`export const CREATE_${upperName} = gql\`
  mutation Create${name}($input: Create${gqlName}Input!) {
    create${gqlName}(input: $input) {
      ${lowerName} {
        id
      }
    }
  }
\``)

  queries.push(`export const UPDATE_${upperName} = gql\`
  mutation Update${name}($update${name}Id: ID!, $input: Update${gqlName}Input!) {
    update${gqlName}(id: $update${name}Id, input: $input) {
      ${lowerName} {
        id
      }
    }
  }
\``)

  queries.push(`export const DELETE_${upperName} = gql\`
  mutation Delete${name}($delete${name}Id: ID!) {
    delete${gqlName}(id: $delete${name}Id) {
      deletedID
    }
  }
\``)

  if (schemaContent.includes(`${gqlName}BulkCreatePayload`)) {
    queries.push(`export const CREATE_CSV_BULK_${upperName} = gql\`
  mutation CreateBulkCSV${name}($input: Upload!) {
    createBulkCSV${gqlName}(input: $input) {
      ${pluralName} {
        id
      }
    }
  }
\``)
  }

  queries.push(`export const BULK_DELETE_${upperName} = gql\`
  mutation DeleteBulk${name}($ids: [ID!]!) {
    deleteBulk${gqlName}(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
\``)

  if (edgeFields.length > 0) {
    const associations = edgeFields
      .map((edge) => {
        const edgeTypeName = edge.type.replace(/Connection|Edge|\[|\]|!|\?/g, '').trim()
        const assocFields = getAssociationFields(edgeTypeName, edge.name)

        return `      ${edge.name} {
        edges {
          node {
            ${assocFields.join('\n            ')}
          }
        }
      }`
      })
      .join('\n')

    queries.push(`export const GET_${upperName}_ASSOCIATIONS = gql\`
  query Get${gqlName}Associations($${lowerName}Id: ID!) {
    ${lowerName}(id: $${lowerName}Id) {
${associations}
    }
  }
\``)
  }

  queries.push(`export const BULK_EDIT_${upperName} = gql\`
  mutation UpdateBulk${name}($ids: [ID!]!, $input: Update${gqlName}Input!) {
    updateBulk${gqlName}(ids: $ids, input: $input) {
      updatedIDs
    }
  }
\``)

  return `import { gql } from 'graphql-request'

${queries.join('\n\n')}
`
}

// Generate queries for all node types
let createdCount = 0
let skippedCount = 0
let excludedCount = 0

for (const nodeType of nodeTypes) {
  const fileName = toKebab(nodeType.name) + '.ts'
  const filePath = path.join(queryOutputDir, fileName)

  // Only create if file doesn't exist
  if (!fs.existsSync(filePath)) {
    const content = generateQueryFile(nodeType)
    fs.writeFileSync(filePath, content)
    createdCount++
    console.log(`Created: ${fileName}`)
  } else {
    skippedCount++
    console.log(`Skipped: ${fileName} (already exists)`)
  }
}

// Count excluded types
const allMatches = [...schemaContent.matchAll(nodeTypeRegex)]
excludedCount = allMatches.filter((m) => EXCLUDED_TYPES.includes(m[1])).length

console.log(`\nSummary: Created ${createdCount} files, skipped ${skippedCount} existing files, excluded ${excludedCount} types`)

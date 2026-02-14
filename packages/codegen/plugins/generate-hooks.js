const fs = require('fs')
const path = require('path')
const { toKebab, toUpperSnake, pluralizeTypeName } = require('./lib')

// Converts kebab-case or snake_case to PascalCase
function toPascalCase(str) {
  return str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

const queryDir = path.join(__dirname, '..', 'query')
const outputDir = path.join(__dirname, '..', '..', '..', 'apps', 'console', 'src', 'lib', 'graphql-hooks')

const queryFiles = fs.readdirSync(queryDir).filter((f) => f.endsWith('.ts'))

for (const file of queryFiles) {
  const baseType = file.replace(/\.ts$/, '')
  const type = toPascalCase(baseType)
  const pluralType = pluralizeTypeName(type)
  const capitalType = toPascalCase(type)
  const capitalPluralType = toPascalCase(pluralType)
  const hookFilePath = path.join(outputDir, toKebab(type) + '.ts')

  if (fs.existsSync(hookFilePath)) {
    console.log(`⏭️  Skipped: ${hookFilePath} (already exists)`)
    continue
  }

  const upperName = toUpperSnake(type)
  const upperPlural = toUpperSnake(pluralType)
  const lowerType = type.charAt(0).toLowerCase() + type.slice(1)
  const lowerPluralType = pluralType.charAt(0).toLowerCase() + pluralType.slice(1)

  const single = upperName
  const all = `GET_ALL_${upperPlural}`
  const create = `CREATE_${upperName}`
  const update = `UPDATE_${upperName}`
  const del = `DELETE_${upperName}`
  const bulkCreate = `CREATE_CSV_BULK_${upperName}`
  const bulkEdit = `BULK_EDIT_${upperName}`
  const bulkDelete = `BULK_DELETE_${upperName}`

  // Read the query file content
  const queryFilePath = path.join(queryDir, file)
  const queryFileContent = fs.readFileSync(queryFilePath, 'utf8')

  // Helper to check if a query/mutation exists in the file
  const hasConst = (constName) => new RegExp(`export const\\s+${constName}\\s*=`).test(queryFileContent)

  // Build up imports and hooks only for existing queries/mutations
  const importNames = []
  const hookBlocks = []
  const typeImports = new Set()

  // GET_ALL
  if (hasConst(all)) {
    importNames.push(all)
    typeImports.add(`${capitalPluralType}WithFilterQuery`)
    typeImports.add(`${capitalPluralType}WithFilterQueryVariables`)
    typeImports.add(`${capitalType}`)
    hookBlocks.push(`
export const use${capitalPluralType}WithFilter = ({ where, orderBy, pagination, enabled = true }: GetAll${capitalPluralType}Args) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<${capitalPluralType}WithFilterQuery, unknown>({
    queryKey: ['${lowerPluralType}', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<${capitalPluralType}WithFilterQuery> => {
      const result = await client.request(${all}, { where, orderBy, ...pagination?.query })
      return result as ${capitalPluralType}WithFilterQuery
    },
    enabled,
  })
  const ${capitalPluralType} = (queryResult.data?.${lowerPluralType}?.edges?.map((edge) => ({ ...edge?.node })) ?? []) as ${capitalType}[]
  return { ...queryResult, ${capitalPluralType} }
}
`)
  }

  // CREATE
  if (hasConst(create)) {
    importNames.push(create)
    typeImports.add(`Create${capitalType}Mutation`)
    typeImports.add(`Create${capitalType}MutationVariables`)
    hookBlocks.push(`
export const useCreate${capitalType} = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<Create${capitalType}Mutation, unknown, Create${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${create}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`)
  }

  // UPDATE
  if (hasConst(update)) {
    importNames.push(update)
    typeImports.add(`Update${capitalType}Mutation`)
    typeImports.add(`Update${capitalType}MutationVariables`)
    hookBlocks.push(`
export const useUpdate${capitalType} = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<Update${capitalType}Mutation, unknown, Update${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${update}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`)
  }

  // DELETE
  if (hasConst(del)) {
    importNames.push(del)
    typeImports.add(`Delete${capitalType}Mutation`)
    typeImports.add(`Delete${capitalType}MutationVariables`)
    hookBlocks.push(`
export const useDelete${capitalType} = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<Delete${capitalType}Mutation, unknown, Delete${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${del}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`)
  }

  // SINGLE GET
  if (hasConst(single)) {
    importNames.push(single)
    typeImports.add(`${capitalType}Query`)
    typeImports.add(`${capitalType}QueryVariables`)
    hookBlocks.push(`
export const use${capitalType} = (${lowerType}Id?: ${capitalType}QueryVariables['${lowerType}Id']) => {
  const { client } = useGraphQLClient()
  return useQuery<${capitalType}Query, unknown>({
    queryKey: ['${lowerPluralType}', ${lowerType}Id],
    queryFn: async (): Promise<${capitalType}Query> => {
      const result = await client.request(${single}, { ${lowerType}Id })
      return result as ${capitalType}Query
    },
    enabled: !!${lowerType}Id,
  })
}
`)
  }

  // BULK CREATE
  if (hasConst(bulkCreate)) {
    importNames.push(bulkCreate)
    typeImports.add(`CreateBulkCsv${capitalType}Mutation`)
    typeImports.add(`CreateBulkCsvTaskMutationVariables`)
    hookBlocks.push(`
export const useCreateBulkCSV${capitalType} = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsv${capitalType}Mutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: ${bulkCreate}, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`)
  }

  // BULK EDIT
  if (hasConst(bulkEdit)) {
    importNames.push(bulkEdit)
    typeImports.add(`UpdateBulk${capitalType}Mutation`)
    typeImports.add(`UpdateBulk${capitalType}MutationVariables`)
    hookBlocks.push(`
export const useBulkEdit${capitalType} = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulk${capitalType}Mutation, unknown, UpdateBulk${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${bulkEdit}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`)
  }

  // BULK DELETE
  if (hasConst(bulkDelete)) {
    importNames.push(bulkDelete)
    typeImports.add(`DeleteBulk${capitalType}Mutation`)
    typeImports.add(`DeleteBulk${capitalType}MutationVariables`)
    hookBlocks.push(`
export const useBulkDelete${capitalType} = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulk${capitalType}Mutation, unknown, DeleteBulk${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${bulkDelete}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`)
  }

  // Only generate the file if at least one hook is present
  if (hookBlocks.length === 0) {
    console.log(`⏭️  Skipped: ${hookFilePath} (no queries found)`)
    continue
  }

  // Compose the import statement for only the present queries
  const importLine = `import { ${importNames.join(', ')} } from '@repo/codegen/query/${toKebab(type)}'`

  // Compose the rest of the imports (schema/types, etc.) as before, but only for used types
  const typeImportLine = `import { ${Array.from(typeImports).join(', ')} } from '@repo/codegen/src/schema'`

  const content = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
${typeImportLine}
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
${importLine}

type GetAll${capitalPluralType}Args = {
  where?: ${capitalPluralType}WithFilterQueryVariables['where']
  orderBy?: ${capitalPluralType}WithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

${hookBlocks.join('\n')}
`

  fs.writeFileSync(hookFilePath, content)
  console.log(`✅ Created: ${hookFilePath}`)
}

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

  const content = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  ${capitalType},
  ${capitalType}Query,
  ${capitalType}QueryVariables,
  ${capitalPluralType}WithFilterQuery,
  ${capitalPluralType}WithFilterQueryVariables,
  Create${capitalType}Mutation,
  Create${capitalType}MutationVariables,
  CreateBulkCsv${capitalType}Mutation,
  CreateBulkCsvTaskMutationVariables,
  Delete${capitalType}Mutation,
  Delete${capitalType}MutationVariables,
  DeleteBulk${capitalType}Mutation,
  DeleteBulk${capitalType}MutationVariables,
  Update${capitalType}Mutation,
  Update${capitalType}MutationVariables,
  UpdateBulk${capitalType}Mutation,
  UpdateBulk${capitalType}MutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { ${single}, ${all}, ${bulkDelete}, ${create}, ${bulkCreate}, ${del}, ${update}, ${bulkEdit} } from '@repo/codegen/query/${toKebab(type)}'

type GetAll${capitalPluralType}Args = {
  where?: ${capitalPluralType}WithFilterQueryVariables['where']
  orderBy?: ${capitalPluralType}WithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

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

  const ${capitalPluralType} = (queryResult.data?.${lowerPluralType}?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as ${capitalType}[]

  return { ...queryResult, ${capitalPluralType} }
}

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

export const useCreateBulkCSV${capitalType} = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsv${capitalType}Mutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: ${bulkCreate}, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}

export const useBulkEdit${capitalType} = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulk${capitalType}Mutation, unknown, UpdateBulk${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${bulkEdit}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}

export const useBulkDelete${capitalType} = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulk${capitalType}Mutation, unknown, DeleteBulk${capitalType}MutationVariables>({
    mutationFn: async (variables) => client.request(${bulkDelete}, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${lowerPluralType}'] })
    },
  })
}
`

  fs.writeFileSync(hookFilePath, content)
  console.log(`✅ Created: ${hookFilePath}`)
}

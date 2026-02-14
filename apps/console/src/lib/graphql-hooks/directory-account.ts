import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  DirectoryAccount,
  DirectoryAccountQuery,
  DirectoryAccountQueryVariables,
  DirectoryAccountsWithFilterQuery,
  DirectoryAccountsWithFilterQueryVariables,
  CreateDirectoryAccountMutation,
  CreateDirectoryAccountMutationVariables,
  CreateBulkCsvTaskMutationVariables,
  DeleteDirectoryAccountMutation,
  DeleteDirectoryAccountMutationVariables,
  UpdateDirectoryAccountMutation,
  UpdateDirectoryAccountMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { DIRECTORY_ACCOUNT, GET_ALL_DIRECTORY_ACCOUNTS, CREATE_DIRECTORY_ACCOUNT, DELETE_DIRECTORY_ACCOUNT, UPDATE_DIRECTORY_ACCOUNT } from '@repo/codegen/query/directory-account'

type GetAllDirectoryAccountsArgs = {
  where?: DirectoryAccountsWithFilterQueryVariables['where']
  orderBy?: DirectoryAccountsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useDirectoryAccountsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDirectoryAccountsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DirectoryAccountsWithFilterQuery, unknown>({
    queryKey: ['directoryAccounts', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DirectoryAccountsWithFilterQuery> => {
      const result = await client.request(GET_ALL_DIRECTORY_ACCOUNTS, { where, orderBy, ...pagination?.query })
      return result as DirectoryAccountsWithFilterQuery
    },
    enabled,
  })

  const DirectoryAccounts = (queryResult.data?.directoryAccounts?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as DirectoryAccount[]

  return { ...queryResult, DirectoryAccounts }
}

export const useCreateDirectoryAccount = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateDirectoryAccountMutation, unknown, CreateDirectoryAccountMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_DIRECTORY_ACCOUNT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryAccounts'] })
    },
  })
}

export const useUpdateDirectoryAccount = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateDirectoryAccountMutation, unknown, UpdateDirectoryAccountMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_DIRECTORY_ACCOUNT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryAccounts'] })
    },
  })
}

export const useDeleteDirectoryAccount = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteDirectoryAccountMutation, unknown, DeleteDirectoryAccountMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_DIRECTORY_ACCOUNT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryAccounts'] })
    },
  })
}

export const useDirectoryAccount = (directoryAccountId?: DirectoryAccountQueryVariables['directoryAccountId']) => {
  const { client } = useGraphQLClient()

  return useQuery<DirectoryAccountQuery, unknown>({
    queryKey: ['directoryAccounts', directoryAccountId],
    queryFn: async (): Promise<DirectoryAccountQuery> => {
      const result = await client.request(DIRECTORY_ACCOUNT, { directoryAccountId })
      return result as DirectoryAccountQuery
    },
    enabled: !!directoryAccountId,
  })
}

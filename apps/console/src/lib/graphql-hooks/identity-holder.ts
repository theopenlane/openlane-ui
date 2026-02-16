import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  IdentityHolder,
  IdentityHolderQuery,
  IdentityHolderQueryVariables,
  IdentityHoldersWithFilterQuery,
  IdentityHoldersWithFilterQueryVariables,
  CreateIdentityHolderMutation,
  CreateIdentityHolderMutationVariables,
  CreateBulkCsvIdentityHolderMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteIdentityHolderMutation,
  DeleteIdentityHolderMutationVariables,
  DeleteBulkIdentityHolderMutation,
  DeleteBulkIdentityHolderMutationVariables,
  UpdateIdentityHolderMutation,
  UpdateIdentityHolderMutationVariables,
  UpdateBulkIdentityHolderMutation,
  UpdateBulkIdentityHolderMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  IDENTITY_HOLDER,
  GET_ALL_IDENTITY_HOLDERS,
  BULK_DELETE_IDENTITY_HOLDER,
  CREATE_IDENTITY_HOLDER,
  CREATE_CSV_BULK_IDENTITY_HOLDER,
  DELETE_IDENTITY_HOLDER,
  UPDATE_IDENTITY_HOLDER,
  BULK_EDIT_IDENTITY_HOLDER,
} from '@repo/codegen/query/identity-holder'

type GetAllIdentityHoldersArgs = {
  where?: IdentityHoldersWithFilterQueryVariables['where']
  orderBy?: IdentityHoldersWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useIdentityHoldersWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllIdentityHoldersArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<IdentityHoldersWithFilterQuery, unknown>({
    queryKey: ['identityHolders', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<IdentityHoldersWithFilterQuery> => {
      const result = await client.request(GET_ALL_IDENTITY_HOLDERS, { where, orderBy, ...pagination?.query })
      return result as IdentityHoldersWithFilterQuery
    },
    enabled,
  })

  const IdentityHolders = (queryResult.data?.identityHolders?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as IdentityHolder[]

  return { ...queryResult, IdentityHolders }
}

export const useCreateIdentityHolder = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateIdentityHolderMutation, unknown, CreateIdentityHolderMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_IDENTITY_HOLDER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

export const useUpdateIdentityHolder = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateIdentityHolderMutation, unknown, UpdateIdentityHolderMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_IDENTITY_HOLDER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

export const useDeleteIdentityHolder = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteIdentityHolderMutation, unknown, DeleteIdentityHolderMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_IDENTITY_HOLDER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

export const useIdentityHolder = (identityHolderId?: IdentityHolderQueryVariables['identityHolderId']) => {
  const { client } = useGraphQLClient()

  return useQuery<IdentityHolderQuery, unknown>({
    queryKey: ['identityHolders', identityHolderId],
    queryFn: async (): Promise<IdentityHolderQuery> => {
      const result = await client.request(IDENTITY_HOLDER, { identityHolderId })
      return result as IdentityHolderQuery
    },
    enabled: !!identityHolderId,
  })
}

export const useCreateBulkCSVIdentityHolder = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvIdentityHolderMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_IDENTITY_HOLDER, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

export const useBulkEditIdentityHolder = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkIdentityHolderMutation, unknown, UpdateBulkIdentityHolderMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_IDENTITY_HOLDER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

export const useBulkDeleteIdentityHolder = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkIdentityHolderMutation, unknown, DeleteBulkIdentityHolderMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_IDENTITY_HOLDER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

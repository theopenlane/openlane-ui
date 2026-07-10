import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type IdentityHoldersWithFilterQuery,
  type IdentityHoldersWithFilterQueryVariables,
  type CreateIdentityHolderMutation,
  type CreateIdentityHolderMutationVariables,
  type UpdateIdentityHolderMutation,
  type UpdateIdentityHolderMutationVariables,
  type DeleteIdentityHolderMutation,
  type DeleteIdentityHolderMutationVariables,
  type IdentityHolderQuery,
  type IdentityHolderQueryVariables,
  type CreateBulkCsvIdentityHolderMutation,
  type CreateBulkCsvIdentityHolderMutationVariables,
  type UpdateBulkIdentityHolderMutation,
  type UpdateBulkIdentityHolderMutationVariables,
  type DeleteBulkIdentityHolderMutation,
  type DeleteBulkIdentityHolderMutationVariables,
  type DirectoryAccountWhereInput,
  type DirectoryMembershipWhereInput,
  type GetIdentityHolderAssociationsQuery,
  type GetIdentityHolderDirectoryAccountsQuery,
  type GetIdentityHolderDirectoryAccountsQueryVariables,
  type GetIdentityHolderEdgesForMergeQuery,
  type GetIdentityHolderEdgesForMergeQueryVariables,
  type GetIdentityHolderFilesPaginatedQuery,
  type UpdateIdentityHolderWithFilesMutationVariables,
  type CreateIdentityHolderWithFilesMutationVariables,
  type FileOrder,
  type FileWhereInput,
  type InputMaybe,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_IDENTITY_HOLDERS,
  CREATE_IDENTITY_HOLDER,
  UPDATE_IDENTITY_HOLDER,
  DELETE_IDENTITY_HOLDER,
  IDENTITY_HOLDER,
  CREATE_CSV_BULK_IDENTITY_HOLDER,
  BULK_EDIT_IDENTITY_HOLDER,
  BULK_DELETE_IDENTITY_HOLDER,
  GET_IDENTITY_HOLDER_ASSOCIATIONS,
  GET_IDENTITY_HOLDER_DIRECTORY_ACCOUNTS,
  GET_IDENTITY_HOLDER_EDGES_FOR_MERGE,
  GET_IDENTITY_HOLDER_FILES_PAGINATED,
  UPDATE_IDENTITY_HOLDER_WITH_FILES,
  CREATE_IDENTITY_HOLDER_WITH_FILES,
} from '@repo/codegen/query/identity-holder'

type GetAllIdentityHoldersArgs = {
  where?: IdentityHoldersWithFilterQueryVariables['where']
  orderBy?: IdentityHoldersWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type IdentityHoldersNode = NonNullable<NonNullable<NonNullable<IdentityHoldersWithFilterQuery['identityHolders']>['edges']>[number]>['node']

export type IdentityHoldersNodeNonNull = NonNullable<IdentityHoldersNode>

export const useIdentityHoldersWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllIdentityHoldersArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<IdentityHoldersWithFilterQuery, unknown>({
    queryKey: ['identityHolders', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<IdentityHoldersWithFilterQuery> => {
      const result = await client.request<IdentityHoldersWithFilterQuery>(GET_ALL_IDENTITY_HOLDERS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.identityHolders?.edges ?? []

  const identityHoldersNodes: IdentityHoldersNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as IdentityHoldersNodeNonNull)

  return { ...queryResult, identityHoldersNodes }
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
  return useMutation<CreateBulkCsvIdentityHolderMutation, unknown, CreateBulkCsvIdentityHolderMutationVariables>({
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

export const useGetIdentityHolderAssociations = (identityHolderId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetIdentityHolderAssociationsQuery, unknown>({
    queryKey: ['identityHolders', identityHolderId, 'associations'],
    queryFn: async () => client.request<GetIdentityHolderAssociationsQuery>(GET_IDENTITY_HOLDER_ASSOCIATIONS, { identityHolderId: identityHolderId as string }),
    enabled: !!identityHolderId,
  })
}

type IdentityHolderFilesPaginationArgs = {
  identityHolderId?: string | null
  orderBy?: InputMaybe<Array<FileOrder> | FileOrder>
  pagination?: TPagination
  where?: FileWhereInput
}

export const useGetIdentityHolderFilesPaginated = ({ identityHolderId, orderBy, pagination, where }: IdentityHolderFilesPaginationArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetIdentityHolderFilesPaginatedQuery, unknown>({
    queryKey: ['identityHolderFiles', identityHolderId, orderBy, pagination?.page, pagination?.pageSize, where],
    queryFn: async () =>
      client.request(GET_IDENTITY_HOLDER_FILES_PAGINATED, {
        identityHolderId,
        orderBy,
        where,
        ...pagination?.query,
      }),
    enabled: !!identityHolderId,
  })

  const identityHolder = queryResult.data?.identityHolder
  const files = identityHolder?.files?.edges?.map((edge) => edge?.node) ?? []
  const pageInfo = identityHolder?.files?.pageInfo
  const totalCount = identityHolder?.files?.totalCount

  return {
    ...queryResult,
    files,
    pageInfo,
    totalCount,
  }
}

export const useUploadIdentityHolderFiles = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateIdentityHolderMutation, unknown, UpdateIdentityHolderWithFilesMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_IDENTITY_HOLDER_WITH_FILES, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolderFiles'] })
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

export const useGetIdentityHolderDirectoryAccounts = (identityHolderId?: string, where?: DirectoryAccountWhereInput, membershipWhere?: DirectoryMembershipWhereInput) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<GetIdentityHolderDirectoryAccountsQuery, unknown>({
    queryKey: ['identityHolders', identityHolderId, 'directoryAccounts', where, membershipWhere],
    queryFn: async () =>
      client.request<GetIdentityHolderDirectoryAccountsQuery, GetIdentityHolderDirectoryAccountsQueryVariables>(GET_IDENTITY_HOLDER_DIRECTORY_ACCOUNTS, {
        identityHolderId: identityHolderId as string,
        where,
        membershipWhere,
      }),
    enabled: !!identityHolderId,
  })

  const edges = queryResult.data?.identityHolder?.directoryAccounts?.edges ?? []
  const directoryAccounts = edges.filter((edge): edge is NonNullable<typeof edge> & { node: NonNullable<NonNullable<typeof edge>['node']> } => edge?.node != null).map((edge) => edge.node)

  return { ...queryResult, directoryAccounts }
}

export const useGetIdentityHolderEdgesForMerge = (identityHolderId?: string | null) => {
  const { client } = useGraphQLClient()
  return useQuery<GetIdentityHolderEdgesForMergeQuery, unknown>({
    queryKey: ['identityHolders', identityHolderId, 'edgesForMerge'],
    queryFn: async () =>
      client.request<GetIdentityHolderEdgesForMergeQuery, GetIdentityHolderEdgesForMergeQueryVariables>(GET_IDENTITY_HOLDER_EDGES_FOR_MERGE, {
        identityHolderId: identityHolderId as string,
      }),
    enabled: !!identityHolderId,
  })
}

export const useCreateIdentityHolderWithFiles = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateIdentityHolderMutation, unknown, CreateIdentityHolderWithFilesMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_IDENTITY_HOLDER_WITH_FILES, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
    },
  })
}

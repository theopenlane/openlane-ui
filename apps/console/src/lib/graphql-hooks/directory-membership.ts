import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  DirectoryMembership,
  DirectoryMembershipQuery,
  DirectoryMembershipQueryVariables,
  DirectoryMembershipsWithFilterQuery,
  DirectoryMembershipsWithFilterQueryVariables,
  CreateDirectoryMembershipMutation,
  CreateDirectoryMembershipMutationVariables,
  CreateBulkCsvDirectoryMembershipMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteDirectoryMembershipMutation,
  DeleteDirectoryMembershipMutationVariables,
  DeleteBulkDirectoryMembershipMutation,
  DeleteBulkDirectoryMembershipMutationVariables,
  UpdateDirectoryMembershipMutation,
  UpdateDirectoryMembershipMutationVariables,
  UpdateBulkDirectoryMembershipMutation,
  UpdateBulkDirectoryMembershipMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  DIRECTORY_MEMBERSHIP,
  GET_ALL_DIRECTORY_MEMBERSHIPS,
  BULK_DELETE_DIRECTORY_MEMBERSHIP,
  CREATE_DIRECTORY_MEMBERSHIP,
  CREATE_CSV_BULK_DIRECTORY_MEMBERSHIP,
  DELETE_DIRECTORY_MEMBERSHIP,
  UPDATE_DIRECTORY_MEMBERSHIP,
  BULK_EDIT_DIRECTORY_MEMBERSHIP,
} from '@repo/codegen/query/directory-membership'

type GetAllDirectoryMembershipsArgs = {
  where?: DirectoryMembershipsWithFilterQueryVariables['where']
  orderBy?: DirectoryMembershipsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useDirectoryMembershipsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDirectoryMembershipsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DirectoryMembershipsWithFilterQuery, unknown>({
    queryKey: ['directoryMemberships', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DirectoryMembershipsWithFilterQuery> => {
      const result = await client.request(GET_ALL_DIRECTORY_MEMBERSHIPS, { where, orderBy, ...pagination?.query })
      return result as DirectoryMembershipsWithFilterQuery
    },
    enabled,
  })

  const DirectoryMemberships = (queryResult.data?.directoryMemberships?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as DirectoryMembership[]

  return { ...queryResult, DirectoryMemberships }
}

export const useCreateDirectoryMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateDirectoryMembershipMutation, unknown, CreateDirectoryMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_DIRECTORY_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryMemberships'] })
    },
  })
}

export const useUpdateDirectoryMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateDirectoryMembershipMutation, unknown, UpdateDirectoryMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_DIRECTORY_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryMemberships'] })
    },
  })
}

export const useDeleteDirectoryMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteDirectoryMembershipMutation, unknown, DeleteDirectoryMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_DIRECTORY_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryMemberships'] })
    },
  })
}

export const useDirectoryMembership = (directoryMembershipId?: DirectoryMembershipQueryVariables['directoryMembershipId']) => {
  const { client } = useGraphQLClient()

  return useQuery<DirectoryMembershipQuery, unknown>({
    queryKey: ['directoryMemberships', directoryMembershipId],
    queryFn: async (): Promise<DirectoryMembershipQuery> => {
      const result = await client.request(DIRECTORY_MEMBERSHIP, { directoryMembershipId })
      return result as DirectoryMembershipQuery
    },
    enabled: !!directoryMembershipId,
  })
}

export const useCreateBulkCSVDirectoryMembership = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvDirectoryMembershipMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_DIRECTORY_MEMBERSHIP, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryMemberships'] })
    },
  })
}

export const useBulkEditDirectoryMembership = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkDirectoryMembershipMutation, unknown, UpdateBulkDirectoryMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_DIRECTORY_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryMemberships'] })
    },
  })
}

export const useBulkDeleteDirectoryMembership = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkDirectoryMembershipMutation, unknown, DeleteBulkDirectoryMembershipMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_DIRECTORY_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryMemberships'] })
    },
  })
}

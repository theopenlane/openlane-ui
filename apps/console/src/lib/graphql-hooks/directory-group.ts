import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  DirectoryGroup,
  DirectoryGroupQuery,
  DirectoryGroupQueryVariables,
  DirectoryGroupsWithFilterQuery,
  DirectoryGroupsWithFilterQueryVariables,
  CreateDirectoryGroupMutation,
  CreateDirectoryGroupMutationVariables,
  DeleteDirectoryGroupMutation,
  DeleteDirectoryGroupMutationVariables,
  UpdateDirectoryGroupMutation,
  UpdateDirectoryGroupMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { DIRECTORY_GROUP, GET_ALL_DIRECTORY_GROUPS, CREATE_DIRECTORY_GROUP, DELETE_DIRECTORY_GROUP, UPDATE_DIRECTORY_GROUP } from '@repo/codegen/query/directory-group'

type GetAllDirectoryGroupsArgs = {
  where?: DirectoryGroupsWithFilterQueryVariables['where']
  orderBy?: DirectoryGroupsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useDirectoryGroupsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDirectoryGroupsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DirectoryGroupsWithFilterQuery, unknown>({
    queryKey: ['directoryGroups', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DirectoryGroupsWithFilterQuery> => {
      const result = await client.request(GET_ALL_DIRECTORY_GROUPS, { where, orderBy, ...pagination?.query })
      return result as DirectoryGroupsWithFilterQuery
    },
    enabled,
  })

  const DirectoryGroups = (queryResult.data?.directoryGroups?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as DirectoryGroup[]

  return { ...queryResult, DirectoryGroups }
}

export const useCreateDirectoryGroup = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateDirectoryGroupMutation, unknown, CreateDirectoryGroupMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_DIRECTORY_GROUP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryGroups'] })
    },
  })
}

export const useUpdateDirectoryGroup = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateDirectoryGroupMutation, unknown, UpdateDirectoryGroupMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_DIRECTORY_GROUP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryGroups'] })
    },
  })
}

export const useDeleteDirectoryGroup = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteDirectoryGroupMutation, unknown, DeleteDirectoryGroupMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_DIRECTORY_GROUP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directoryGroups'] })
    },
  })
}

export const useDirectoryGroup = (directoryGroupId?: DirectoryGroupQueryVariables['directoryGroupId']) => {
  const { client } = useGraphQLClient()

  return useQuery<DirectoryGroupQuery, unknown>({
    queryKey: ['directoryGroups', directoryGroupId],
    queryFn: async (): Promise<DirectoryGroupQuery> => {
      const result = await client.request(DIRECTORY_GROUP, { directoryGroupId })
      return result as DirectoryGroupQuery
    },
    enabled: !!directoryGroupId,
  })
}

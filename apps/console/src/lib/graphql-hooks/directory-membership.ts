import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type DirectoryMembershipsWithFilterQuery,
  type DirectoryMembershipsWithFilterQueryVariables,
  type CreateDirectoryMembershipMutation,
  type CreateDirectoryMembershipMutationVariables,
  type UpdateDirectoryMembershipMutation,
  type UpdateDirectoryMembershipMutationVariables,
  type DeleteDirectoryMembershipMutation,
  type DeleteDirectoryMembershipMutationVariables,
  type DirectoryMembershipQuery,
  type DirectoryMembershipQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_DIRECTORY_MEMBERSHIPS, CREATE_DIRECTORY_MEMBERSHIP, UPDATE_DIRECTORY_MEMBERSHIP, DELETE_DIRECTORY_MEMBERSHIP, DIRECTORY_MEMBERSHIP } from '@repo/codegen/query/directory-membership'

type GetAllDirectoryMembershipsArgs = {
  where?: DirectoryMembershipsWithFilterQueryVariables['where']
  orderBy?: DirectoryMembershipsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type DirectoryMembershipsNode = NonNullable<NonNullable<NonNullable<DirectoryMembershipsWithFilterQuery['directoryMemberships']>['edges']>[number]>['node']

export type DirectoryMembershipsNodeNonNull = NonNullable<DirectoryMembershipsNode>

export const useDirectoryMembershipsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDirectoryMembershipsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<DirectoryMembershipsWithFilterQuery, unknown>({
    queryKey: ['directoryMemberships', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DirectoryMembershipsWithFilterQuery> => {
      const result = await client.request<DirectoryMembershipsWithFilterQuery>(GET_ALL_DIRECTORY_MEMBERSHIPS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.directoryMemberships?.edges ?? []

  const directoryMembershipsNodes: DirectoryMembershipsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as DirectoryMembershipsNodeNonNull)

  return { ...queryResult, directoryMembershipsNodes }
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

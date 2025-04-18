import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_GROUPS, GET_GROUP_DETAILS, GET_GROUP_PERMISSIONS, CREATE_GROUP_WITH_MEMBERS, UPDATE_GROUP, DELETE_GROUP, UPDATE_GROUP_MEMBERSHIP } from '@repo/codegen/query/group' // adjust path as needed

import {
  GetAllGroupsQuery,
  GetAllGroupsQueryVariables,
  GetGroupDetailsQuery,
  GetGroupDetailsQueryVariables,
  GetGroupPermissionsQuery,
  GetGroupPermissionsQueryVariables,
  CreateGroupWithMembersMutation,
  CreateGroupWithMembersMutationVariables,
  UpdateGroupMutation,
  UpdateGroupMutationVariables,
  DeleteGroupMutation,
  DeleteGroupMutationVariables,
  UpdateGroupMembershipMutation,
  UpdateGroupMembershipMutationVariables,
  Group,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

type GroupsArgs = {
  where?: GetAllGroupsQueryVariables['where']
  orderBy?: GetAllGroupsQueryVariables['orderBy']
  enabled?: boolean
  pagination?: TPagination
  search?: string
}

export const useGetAllGroups = ({ where, orderBy, pagination, enabled = true }: GroupsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllGroupsQuery>({
    queryKey: ['groups', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_ALL_GROUPS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const groups = (queryResult.data?.groups?.edges?.map((edge) => edge?.node) ?? []) as Group[]

  const paginationMeta = {
    totalCount: queryResult.data?.groups?.totalCount ?? 0,
    pageInfo: queryResult.data?.groups?.pageInfo,
    isLoading: queryResult.isFetching,
  }
  return {
    ...queryResult,
    groups,
    paginationMeta,
  }
}

export const useGetGroupDetails = (groupId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetGroupDetailsQuery, GetGroupDetailsQueryVariables>({
    queryKey: ['groups', groupId],
    queryFn: () => client.request(GET_GROUP_DETAILS, { groupId }),
    enabled: !!groupId,
  })
}

export const useGetGroupPermissions = (groupId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetGroupPermissionsQuery, GetGroupPermissionsQueryVariables>({
    queryKey: ['groups', groupId, 'permissions'],
    queryFn: () => client.request(GET_GROUP_PERMISSIONS, { groupId }),
    enabled: !!groupId,
  })
}

export const useCreateGroupWithMembers = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateGroupWithMembersMutation, unknown, CreateGroupWithMembersMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_GROUP_WITH_MEMBERS, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export const useUpdateGroup = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateGroupMutation, unknown, UpdateGroupMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_GROUP, variables),
  })
}

export const useDeleteGroup = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteGroupMutation, unknown, DeleteGroupMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_GROUP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export const useUpdateGroupMembership = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateGroupMembershipMutation, unknown, UpdateGroupMembershipMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_GROUP_MEMBERSHIP, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

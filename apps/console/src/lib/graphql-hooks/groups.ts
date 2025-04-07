import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_GROUPS, GET_GROUP_DETAILS, GET_GROUP_PERMISSIONS, CREATE_GROUP_WITH_MEMBERS, UPDATE_GROUP, DELETE_GROUP, UPDATE_GROUP_MEMBERSHIP, SEARCH_GROUPS } from '@repo/codegen/query/group' // adjust path as needed

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
  SearchGroupsQuery,
  SearchGroupsQueryVariables,
  Group,
} from '@repo/codegen/src/schema'
import { useDebounce } from '../../../../../packages/ui/src/hooks/use-debounce'

type UseGetAllGroupsArgs = {
  where?: GetAllGroupsQueryVariables['where']
  orderBy?: GetAllGroupsQueryVariables['orderBy']
  enabled?: boolean
}

export const useFilteredGroups = (searchQuery: string, where?: GetAllGroupsQueryVariables['where'], orderBy?: GetAllGroupsQueryVariables['orderBy'], enabled = true) => {
  const debouncedSearchTerm = useDebounce(searchQuery, 300)
  const { groups: allGroups, isLoading: isFetchingAll, ...allQueryRest } = useGetAllGroups({ where, orderBy, enabled })
  const { groups: searchGroupsRaw, isLoading: isSearching, ...searchQueryRest } = useSearchGroups(debouncedSearchTerm)
  const showSearch = !!debouncedSearchTerm
  const filteredAndOrderedGroups = showSearch ? allGroups?.filter((proc) => searchGroupsRaw?.some((searchProc) => searchProc.id === proc.id)) : allGroups
  const isLoading = showSearch ? isSearching : isFetchingAll

  return {
    groups: filteredAndOrderedGroups,
    isLoading,
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

export const useGetAllGroups = ({ where, orderBy, enabled = true }: UseGetAllGroupsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllGroupsQuery>({
    queryKey: ['groups', { where, orderBy }],
    queryFn: () => client.request<GetAllGroupsQuery, GetAllGroupsQueryVariables>(GET_ALL_GROUPS, { where, orderBy }),
    enabled,
  })

  const groups = (queryResult.data?.groups?.edges?.map((edge) => edge?.node) ?? []) as Group[]

  return { ...queryResult, groups }
}

export function useSearchGroups(searchQuery: string) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchGroupsQuery, unknown>({
    queryKey: ['searchGroups', searchQuery],
    queryFn: async () =>
      client.request<SearchGroupsQuery, SearchGroupsQueryVariables>(SEARCH_GROUPS, {
        query: searchQuery,
      }),
    enabled: !!searchQuery,
  })

  const groups = (queryResult.data?.groupSearch?.groups ?? []) as Group[]

  return { ...queryResult, groups }
}

export const useGetGroupDetails = (groupId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetGroupDetailsQuery, GetGroupDetailsQueryVariables>({
    queryKey: ['group', groupId],
    queryFn: () => client.request(GET_GROUP_DETAILS, { groupId }),
    enabled: !!groupId,
  })
}

export const useGetGroupPermissions = (groupId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetGroupPermissionsQuery, GetGroupPermissionsQueryVariables>({
    queryKey: ['group', groupId, 'permissions'],
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

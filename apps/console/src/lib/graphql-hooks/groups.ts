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
import { TPagination } from '@repo/ui/pagination-types'

type GroupsArgs = {
  where?: GetAllGroupsQueryVariables['where']
  orderBy?: GetAllGroupsQueryVariables['orderBy']
  enabled?: boolean
  pagination?: TPagination
  search?: string
}

export const useFilteredGroups = ({ where, enabled, orderBy, pagination, search = '' }: GroupsArgs) => {
  const debouncedSearchTerm = useDebounce(search, 300)

  const { groups: allGroups, isLoading: isFetchingAll, data: allData, ...allQueryRest } = useGetAllGroups({ where, orderBy, pagination, enabled })

  const { groups: searchGroupsRaw, isLoading: isSearching, data: searchData, ...searchQueryRest } = useSearchGroups({ search: debouncedSearchTerm, pagination })

  const showSearch = !!debouncedSearchTerm
  const isLoading = showSearch ? isSearching : isFetchingAll

  const filteredAndOrderedGroups = showSearch ? allGroups?.filter((group) => searchGroupsRaw?.some((searchGroup) => searchGroup.id === group.id)) : allGroups

  const paginationMeta = () => {
    if (!showSearch) {
      return {
        totalCount: allData?.groups?.totalCount ?? 0,
        pageInfo: allData?.groups?.pageInfo,
        isLoading,
      }
    }

    return {
      totalCount: searchData?.groupSearch?.totalCount ?? 0,
      pageInfo: searchData?.groupSearch?.pageInfo,
      isLoading,
    }
  }

  return {
    groups: filteredAndOrderedGroups,
    isLoading,
    paginationMeta: paginationMeta(),
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
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

  return {
    ...queryResult,
    groups,
    pageInfo: queryResult.data?.groups?.pageInfo,
    totalCount: queryResult.data?.groups?.totalCount ?? 0,
  }
}

type UseSearchGroupsArgs = {
  search: string
  pagination?: TPagination
}

export function useSearchGroups({ search, pagination }: UseSearchGroupsArgs) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchGroupsQuery, unknown>({
    queryKey: ['searchGroups', search, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request<SearchGroupsQuery, SearchGroupsQueryVariables>(SEARCH_GROUPS, {
        query: search,
        ...pagination?.query,
      }),
    enabled: !!search,
  })

  const groups = (queryResult.data?.groupSearch?.edges?.map((edge) => edge?.node) ?? []) as Group[]
  const pageInfo = queryResult.data?.groupSearch?.pageInfo
  const totalCount = queryResult.data?.groupSearch?.totalCount ?? 0

  return {
    ...queryResult,
    groups,
    pageInfo,
    totalCount,
  }
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

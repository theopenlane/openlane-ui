import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { UPDATE_USER_ROLE_IN_ORG, REMOVE_USER_FROM_ORG, GET_ORG_MEMBERSHIPS, GET_ORG_USER_LIST } from '@repo/codegen/query/member'

import {
  UpdateUserRoleInOrgMutation,
  UpdateUserRoleInOrgMutationVariables,
  RemoveUserFromOrgMutation,
  RemoveUserFromOrgMutationVariables,
  OrgMembershipsQuery,
  OrgMembershipsQueryVariables,
  OrgMembershipWhereInput,
  OrgMembership,
  User,
  OrgMembershipsByIdsQuery,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

export const useUpdateUserRoleInOrg = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateUserRoleInOrgMutation, unknown, UpdateUserRoleInOrgMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_USER_ROLE_IN_ORG, variables),
  })
}

export const useRemoveUserFromOrg = () => {
  const { client } = useGraphQLClient()

  return useMutation<RemoveUserFromOrgMutation, unknown, RemoveUserFromOrgMutationVariables>({
    mutationFn: (variables) => client.request(REMOVE_USER_FROM_ORG, variables),
  })
}

type TUseGetOrgMemberships = {
  where?: OrgMembershipWhereInput
  pagination?: TPagination
  enabled?: boolean
  orderBy?: OrgMembershipsQueryVariables['orderBy']
}

export const useGetOrgMemberships = ({ where, pagination, enabled, orderBy }: TUseGetOrgMemberships) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<OrgMembershipsQuery, OrgMembershipsQueryVariables>({
    queryKey: ['memberships', where, pagination?.pageSize, pagination?.page],
    queryFn: () => client.request(GET_ORG_MEMBERSHIPS, { where, ...pagination?.query, orderBy }),
    enabled,
  })

  const members = (queryResult.data?.orgMemberships?.edges ?? []).map((edge) => edge?.node) as OrgMembership[]

  const paginationMeta = {
    totalCount: queryResult.data?.orgMemberships?.totalCount ?? 0,
    pageInfo: queryResult.data?.orgMemberships?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    members,
    paginationMeta,
    isLoading: queryResult.isFetching,
  }
}

type TUseGetOrgUserListProps = {
  where?: OrgMembershipWhereInput
}

export const useGetOrgUserList = ({ where }: TUseGetOrgUserListProps) => {
  const idInNotEmpty = Array.isArray(where?.hasUserWith?.[0]?.idIn) && where.hasUserWith[0].idIn.length > 0
  const { client } = useGraphQLClient()

  const queryResult = useQuery<OrgMembershipsByIdsQuery, OrgMembershipsQueryVariables>({
    queryKey: ['memberships', where],
    queryFn: () => client.request(GET_ORG_USER_LIST, { where }),
    enabled: idInNotEmpty,
  })

  const users = (queryResult.data?.orgMemberships?.edges ?? []).map((edge) => edge?.node?.user) as User[]

  return {
    ...queryResult,
    users,
    isLoading: queryResult.isFetching,
  }
}

type UserSelectArgs = {
  where?: OrgMembershipWhereInput
  enabled?: boolean
}

export const useUserSelect = (args: UserSelectArgs) => {
  const { data, ...rest } = useGetOrgMemberships(args)

  const userOptions =
    data?.orgMemberships?.edges?.map((edge) => ({
      label: edge?.node?.user.displayName || '',
      value: edge?.node?.user.id || '',
    })) ?? []

  return { userOptions, ...rest }
}

export const useUserSelectEmail = (args: UserSelectArgs) => {
  const { data, ...rest } = useGetOrgMemberships(args)

  const userOptions =
    data?.orgMemberships?.edges?.map((edge) => ({
      label: edge?.node?.user.email || '',
      value: edge?.node?.user.id || '',
    })) ?? []

  return { userOptions, ...rest }
}

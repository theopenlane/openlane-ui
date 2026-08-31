import { useMutation, useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useSession } from 'next-auth/react'
import { OPENLANE_SUPPORT_USER_ID, supportUser } from '@/constants/support'

import { UPDATE_USER_ROLE_IN_ORG, REMOVE_USER_FROM_ORG, GET_ORG_MEMBERSHIPS, GET_ORG_MEMBERSHIPS_EXPORT, GET_ORG_USER_LIST } from '@repo/codegen/query/member'

import {
  type UpdateUserRoleInOrgMutation,
  type UpdateUserRoleInOrgMutationVariables,
  type RemoveUserFromOrgMutation,
  type RemoveUserFromOrgMutationVariables,
  type OrgMembershipsQuery,
  type OrgMembershipsQueryVariables,
  type OrgMembershipWhereInput,
  type OrgMembership,
  type User,
  type OrgMembershipsByIdsQuery,
  type OrgMembershipsExportQuery,
  type OrgMembershipsExportQueryVariables,
  OrgMembershipRole,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { EXPORT_PAGE_SIZE } from '@/constants/pagination'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'

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

  const members = useMemo(() => (queryResult.data?.orgMemberships?.edges ?? []).map((edge) => edge?.node) as OrgMembership[], [queryResult.data])

  const paginationMeta = {
    totalCount: queryResult.data?.orgMemberships?.totalCount ?? 0,
    pageInfo: queryResult.data?.orgMemberships?.pageInfo,
    isLoading: queryResult.isPending,
  }

  return {
    ...queryResult,
    members,
    paginationMeta,
    isLoading: queryResult.isPending,
  }
}

export const useCurrentUserRole = () => {
  const { data: sessionData } = useSession()
  const userId = sessionData?.user?.userId

  const { members, isLoading } = useGetOrgMemberships({
    where: { hasUserWith: [{ id: userId }] },
    enabled: !!userId,
  })

  return {
    role: members[0]?.role,
    isLoading,
  }
}

export const useIsAuditor = () => {
  const { role, isLoading } = useCurrentUserRole()
  return {
    isAuditor: role === OrgMembershipRole.AUDITOR,
    isLoading,
  }
}

type TUseGetOrgUserListProps = {
  where?: OrgMembershipWhereInput
}

export const toOrgUserList = (data: OrgMembershipsByIdsQuery | undefined, requestedIds: readonly string[]): User[] => {
  const users = (data?.orgMemberships?.edges ?? []).map((edge) => edge?.node?.user) as User[]
  const injectSupport = !!OPENLANE_SUPPORT_USER_ID && requestedIds.includes(OPENLANE_SUPPORT_USER_ID) && !users.some((u) => u?.id === OPENLANE_SUPPORT_USER_ID)

  return injectSupport ? [...users, supportUser()] : users
}

export const useGetOrgUserList = ({ where }: TUseGetOrgUserListProps) => {
  const idInNotEmpty = Array.isArray(where?.hasUserWith?.[0]?.idIn) && where.hasUserWith[0].idIn.length > 0
  const { client } = useGraphQLClient()

  const queryResult = useQuery<OrgMembershipsByIdsQuery, OrgMembershipsQueryVariables>({
    queryKey: ['memberships', where],
    queryFn: () => client.request(GET_ORG_USER_LIST, { where }),
    enabled: idInNotEmpty,
  })

  const requestedIds = useMemo(() => where?.hasUserWith?.[0]?.idIn ?? [], [where])
  const users = useMemo(() => toOrgUserList(queryResult.data, requestedIds), [queryResult.data, requestedIds])

  return {
    ...queryResult,
    users,
    isLoading: queryResult.isPending,
  }
}

type UserSelectArgs = {
  where?: OrgMembershipWhereInput
  enabled?: boolean
}

export const useUserSelect = (args: UserSelectArgs) => {
  const { data, ...rest } = useGetOrgMemberships(args)

  const userOptions = useMemo(
    () =>
      data?.orgMemberships?.edges?.map((edge) => ({
        label: edge?.node?.user.displayName || '',
        value: edge?.node?.user.id || '',
      })) ?? [],
    [data],
  )

  return { userOptions, ...rest }
}

export const useUserSelectEmail = (args: UserSelectArgs) => {
  const { data, ...rest } = useGetOrgMemberships(args)

  const userOptions = useMemo(
    () =>
      data?.orgMemberships?.edges?.map((edge) => ({
        label: edge?.node?.user.email || '',
        value: edge?.node?.user.id || '',
      })) ?? [],
    [data],
  )

  return { userOptions, ...rest }
}

export type OrgMembershipExportNode = NonNullable<NonNullable<NonNullable<OrgMembershipsExportQuery['orgMemberships']['edges']>[number]>['node']>

type TFetchAllOrgMembershipsForExport = {
  where?: OrgMembershipWhereInput
  orderBy?: OrgMembershipsExportQueryVariables['orderBy']
}

export const useFetchAllOrgMembershipsForExport = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    ({ where, orderBy }: TFetchAllOrgMembershipsForExport) =>
      fetchAllConnectionNodes<OrgMembershipExportNode>(async (after) => {
        const result = await client.request<OrgMembershipsExportQuery, OrgMembershipsExportQueryVariables>(GET_ORG_MEMBERSHIPS_EXPORT, { where, orderBy, first: EXPORT_PAGE_SIZE, after })
        return result.orgMemberships
      }),
    [client],
  )
}

import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { UPDATE_USER_ROLE_IN_ORG, REMOVE_USER_FROM_ORG, GET_ORG_MEMBERSHIPS } from '@repo/codegen/query/member'

import {
  UpdateUserRoleInOrgMutation,
  UpdateUserRoleInOrgMutationVariables,
  RemoveUserFromOrgMutation,
  RemoveUserFromOrgMutationVariables,
  OrgMembershipsQuery,
  OrgMembershipsQueryVariables,
  OrgMembershipWhereInput,
  OrgMembership,
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
}

export const useGetOrgMemberships = ({ where, pagination, enabled }: TUseGetOrgMemberships) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<OrgMembershipsQuery, OrgMembershipsQueryVariables>({
    queryKey: ['memberships', where, pagination?.pageSize, pagination?.page],
    queryFn: () => client.request(GET_ORG_MEMBERSHIPS, { where, ...pagination?.query }),
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

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

export const useGetOrgMemberships = ({ pagination, where, enabled = true }: { pagination?: TPagination; where?: OrgMembershipWhereInput; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<OrgMembershipsQuery, OrgMembershipsQueryVariables>({
    queryKey: ['memberships', pagination?.pageSize, pagination?.page],
    queryFn: async () => client.request(GET_ORG_MEMBERSHIPS, { where, ...pagination?.query }),
    enabled,
  })
}

import { useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { UPDATE_USER_ROLE_IN_ORG, REMOVE_USER_FROM_ORG } from '@repo/codegen/query/member'

import { UpdateUserRoleInOrgMutation, UpdateUserRoleInOrgMutationVariables, RemoveUserFromOrgMutation, RemoveUserFromOrgMutationVariables } from '@repo/codegen/src/schema'

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

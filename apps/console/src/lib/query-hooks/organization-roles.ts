import { useFetchWithRetry } from '@/lib/graphqlClient'
import { readPermissionResponse, shouldRetryPermission, usePermissionQueryErrorLog } from '@/lib/query-hooks/permissions'
import { invalidateMembershipQueries } from '@/lib/graphql-hooks/membership-cache'
import { type OrganizationRole, type OrganizationRolesListReply, type OrganizationRolesMutationReply } from '@/types/organization-roles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useOrganizationResponsibilityRoles = () => {
  const fetchWithRetry = useFetchWithRetry()

  const resp = useQuery<OrganizationRolesListReply>({
    queryKey: ['organizationResponsibilityRoles'],
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/organization-roles', { method: 'GET' })
      return readPermissionResponse<OrganizationRolesListReply>(res, 'Failed to fetch organization roles')
    },
  })

  usePermissionQueryErrorLog(resp, 'Failed to fetch organization responsibility roles')

  return resp
}

type MutateRolesVariables = {
  roles: string[]
  userIds?: string[]
  groupIds?: string[]
}

const useMutateOrganizationRoles = (method: 'POST' | 'DELETE') => {
  const fetchWithRetry = useFetchWithRetry()
  const queryClient = useQueryClient()

  return useMutation<OrganizationRolesMutationReply[], Error, MutateRolesVariables>({
    mutationFn: async ({ roles, userIds, groupIds }) => {
      const results = await Promise.allSettled(
        roles.map(async (role) => {
          const res = await fetchWithRetry('/api/organization-roles', {
            method,
            body: JSON.stringify({
              role,
              ...(userIds && userIds.length > 0 ? { user_ids: userIds } : {}),
              ...(groupIds && groupIds.length > 0 ? { group_ids: groupIds } : {}),
            }),
          })
          return readPermissionResponse<OrganizationRolesMutationReply>(res, method === 'POST' ? 'Failed to assign organization role' : 'Failed to remove organization role')
        }),
      )

      const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      if (rejected.length > 0) {
        const action = method === 'POST' ? 'assign' : 'remove'
        const reasons = rejected.map((result) => (result.reason instanceof Error ? result.reason.message : 'Unknown error')).join('; ')
        throw new Error(`Failed to ${action} ${rejected.length} of ${roles.length} role(s): ${reasons}`)
      }

      return results.filter((result): result is PromiseFulfilledResult<OrganizationRolesMutationReply> => result.status === 'fulfilled').map((result) => result.value)
    },
    onSettled: () => invalidateMembershipQueries(queryClient),
  })
}

export const useAssignOrganizationRoles = () => useMutateOrganizationRoles('POST')

export const useRemoveOrganizationRoles = () => useMutateOrganizationRoles('DELETE')

export type { OrganizationRole }

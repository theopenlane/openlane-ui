import { useNotification } from '@/hooks/useNotification'
import { useFetchWithRetry, getIsSessionInvalid } from '@/lib/graphqlClient'
import { readPermissionResponse, shouldRetryPermission } from '@/lib/query-hooks/permissions'
import { invalidateMembershipQueries } from '@/lib/graphql-hooks/membership-cache'
import { type OrganizationRole, type OrganizationRolesListReply, type OrganizationRolesMutationReply } from '@/types/organization-roles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export const useOrganizationResponsibilityRoles = () => {
  const { errorNotification } = useNotification()
  const fetchWithRetry = useFetchWithRetry()

  const resp = useQuery<OrganizationRolesListReply>({
    queryKey: ['organizationResponsibilityRoles'],
    retry: shouldRetryPermission,
    queryFn: async () => {
      const res = await fetchWithRetry('/api/organization-roles', { method: 'GET' })
      return readPermissionResponse<OrganizationRolesListReply>(res, 'Failed to fetch organization roles')
    },
  })

  useEffect(() => {
    if (resp.isError && !getIsSessionInvalid()) {
      errorNotification({
        title: 'Error occurred while fetching organization roles',
        description: 'Please refresh the page',
      })
    }
  }, [resp.isError, errorNotification])

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
      return Promise.all(
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
    },
    onSuccess: () => invalidateMembershipQueries(queryClient),
  })
}

export const useAssignOrganizationRoles = () => useMutateOrganizationRoles('POST')

export const useRemoveOrganizationRoles = () => useMutateOrganizationRoles('DELETE')

export type { OrganizationRole }

import { type QueryClient } from '@tanstack/react-query'

export const CURRENT_USER_ORGANIZATIONS_QUERY_ROOT = 'currentUserOrganizations'

const MEMBERSHIP_QUERY_ROOTS = ['memberships', 'organizationsWithMembers', CURRENT_USER_ORGANIZATIONS_QUERY_ROOT, 'groups', 'accountRoles', 'accountRolesMany', 'organizationRole', 'scopes']

export const invalidateMembershipQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0]
      return typeof root === 'string' && MEMBERSHIP_QUERY_ROOTS.includes(root)
    },
  })
}

export const invalidateCurrentUserOrganizations = (queryClient: QueryClient) => queryClient.invalidateQueries({ queryKey: [CURRENT_USER_ORGANIZATIONS_QUERY_ROOT] })

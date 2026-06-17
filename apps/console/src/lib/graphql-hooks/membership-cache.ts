import { type QueryClient } from '@tanstack/react-query'

const MEMBERSHIP_QUERY_ROOTS = ['memberships', 'organizationsWithMembers', 'groups', 'accountRoles', 'accountRolesMany', 'organizationRole', 'scopes']

export const invalidateMembershipQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const root = query.queryKey[0]
      return typeof root === 'string' && MEMBERSHIP_QUERY_ROOTS.includes(root)
    },
  })
}

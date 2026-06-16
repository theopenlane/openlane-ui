import { type QueryClient } from '@tanstack/react-query'

const MEMBERSHIP_QUERY_ROOTS = ['memberships', 'organizationsWithMembers', 'groups', 'group']

export const invalidateMembershipQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({
    predicate: (query) => MEMBERSHIP_QUERY_ROOTS.includes(query.queryKey[0] as string),
  })
}

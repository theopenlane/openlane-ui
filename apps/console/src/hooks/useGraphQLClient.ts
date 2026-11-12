import { useGetGraphQLClient } from '@/lib/graphqlClient'
import { useQueryClient } from '@tanstack/react-query'

export const useGraphQLClient = (cookieAuth = false) => {
  const client = useGetGraphQLClient(cookieAuth)
  const queryClient = useQueryClient()
  return { client, queryClient }
}

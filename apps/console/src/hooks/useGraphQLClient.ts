import { useGetGraphQLClient } from '@/lib/graphqlClient'
import { useQueryClient } from '@tanstack/react-query'

export const useGraphQLClient = () => {
  const client = useGetGraphQLClient()
  const queryClient = useQueryClient()
  return { client, queryClient }
}

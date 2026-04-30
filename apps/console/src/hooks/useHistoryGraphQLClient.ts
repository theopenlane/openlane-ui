import { useGetHistoryGraphQLClient } from '@/lib/historyGraphqlClient'
import { useQueryClient } from '@tanstack/react-query'

export const useHistoryGraphQLClient = () => {
  const client = useGetHistoryGraphQLClient()
  const queryClient = useQueryClient()
  return { client, queryClient }
}

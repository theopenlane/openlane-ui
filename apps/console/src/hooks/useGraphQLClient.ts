import { getGraphQLClient } from '@/lib/graphqlClient'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'

export const useGraphQLClient = () => {
  const { data: session } = useSession()
  const client = getGraphQLClient(session!)
  const queryClient = useQueryClient()
  return { client, queryClient }
}

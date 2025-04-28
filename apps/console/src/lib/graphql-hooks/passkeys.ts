import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GetPasskeysQuery } from '@repo/codegen/src/schema'
import { GET_PASSKEYS } from '@repo/codegen/query/passkey'

export const useGetPasskeys = (userId?: string | null) => {
  const { client } = useGraphQLClient()
  return useQuery<GetPasskeysQuery, unknown>({
    queryKey: ['passkeys'],
    queryFn: async () => client.request(GET_PASSKEYS, { userId }),
  })
}

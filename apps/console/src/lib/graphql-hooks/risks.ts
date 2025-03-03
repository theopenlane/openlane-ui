import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { GET_ALL_RISKS } from '@repo/codegen/query/risks'

import { GetAllRisksQuery } from '@repo/codegen/src/schema'

export const useGetAllRisks = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllRisksQuery, unknown>({
    queryKey: ['risks'],
    queryFn: async () => client.request(GET_ALL_RISKS),
  })
}

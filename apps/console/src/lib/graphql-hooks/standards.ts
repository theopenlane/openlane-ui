import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { GET_ALL_STANDARDS } from '@repo/codegen/query/standards'

import { GetAllStandardsQuery, GetAllStandardsQueryVariables } from '@repo/codegen/src/schema'

export const useGetStandards = (where?: GetAllStandardsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', where],
    queryFn: () => client.request(GET_ALL_STANDARDS, { where }),
  })
}

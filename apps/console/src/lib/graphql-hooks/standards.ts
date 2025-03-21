import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { GET_ALL_STANDARDS, GET_STANDARD_DETAILS } from '@repo/codegen/query/standards'

import { GetAllStandardsQuery, GetAllStandardsQueryVariables, GetStandardDetailsQuery } from '@repo/codegen/src/schema'

export const useGetStandards = (where?: GetAllStandardsQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllStandardsQuery>({
    queryKey: ['standards', where],
    queryFn: () => client.request(GET_ALL_STANDARDS, { where }),
  })
}

export const useGetStandardDetails = (standardId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetStandardDetailsQuery>({
    queryKey: ['standard', standardId],
    queryFn: () => client.request(GET_STANDARD_DETAILS, { standardId }),
    enabled: !!standardId,
  })
}

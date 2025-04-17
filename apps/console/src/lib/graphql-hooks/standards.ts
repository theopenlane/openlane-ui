import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_CONTROLS_BY_CLONE, GET_ALL_STANDARDS, GET_STANDARD_DETAILS } from '@repo/codegen/query/standards'

import { CloneControlInput, CreateControlsByCloneMutation, GetAllStandardsQuery, GetAllStandardsQueryVariables, GetStandardDetailsQuery } from '@repo/codegen/src/schema'

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

export const useCloneControls = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateControlsByCloneMutation, Error, { input: CloneControlInput }>({
    mutationFn: ({ input }) => client.request(CREATE_CONTROLS_BY_CLONE, { input }),
  })
}

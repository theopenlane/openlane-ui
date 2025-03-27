import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { GET_ALL_RISKS, GET_RISK_BY_ID, UPDATE_RISK } from '@repo/codegen/query/risks'

import { GetAllRisksQuery, GetRiskByIdQuery, GetRiskByIdQueryVariables, RiskWhereInput, UpdateRiskMutation, UpdateRiskMutationVariables } from '@repo/codegen/src/schema'

export const useGetAllRisks = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllRisksQuery, unknown>({
    queryKey: ['risks'],
    queryFn: async () => client.request(GET_ALL_RISKS),
  })
}

export const useRisksWithFilter = (where: RiskWhereInput) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllRisksQuery, unknown>({
    queryKey: ['risks', where],
    queryFn: async () => {
      return client.request<GetAllRisksQuery>(GET_ALL_RISKS, { where })
    },
  })
}

export const useGetRiskById = (riskId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetRiskByIdQuery, unknown>({
    queryKey: ['risks', riskId],
    queryFn: async () => {
      if (!riskId) throw new Error('Missing risk ID')
      return client.request<GetRiskByIdQuery, GetRiskByIdQueryVariables>(GET_RISK_BY_ID, { riskId })
    },
    enabled: !!riskId,
  })
}

export const useUpdateRisk = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateRiskMutation, unknown, UpdateRiskMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_RISK, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['risks', data.updateRisk.risk.id] })
      queryClient.invalidateQueries({ queryKey: ['risks'] })
    },
  })
}

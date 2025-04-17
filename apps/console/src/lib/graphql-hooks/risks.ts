import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { GET_ALL_RISKS, GET_RISK_BY_ID, UPDATE_RISK } from '@repo/codegen/query/risks'

import {
  GetAllRisksQuery,
  GetRiskByIdQuery,
  GetRiskByIdQueryVariables,
  Risk,
  RiskFieldsFragment,
  RiskOrder,
  RiskWhereInput,
  UpdateRiskMutation,
  UpdateRiskMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

export const useGetAllRisks = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllRisksQuery, unknown>({
    queryKey: ['risks'],
    queryFn: async () => client.request(GET_ALL_RISKS),
  })
}

type UseRisksWithFilterProps = {
  where?: RiskWhereInput
  pagination?: TPagination
  orderBy?: RiskOrder[]
}

export const useRisksWithFilter = ({ where, pagination, orderBy }: UseRisksWithFilterProps) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: ['risks', { where, pagination, orderBy }],
    queryFn: async () =>
      await client.request<GetAllRisksQuery>(GET_ALL_RISKS, {
        where,
        pagination,
        orderBy,
      }),
  })

  const risks = queryResult?.data?.risks?.edges?.map((edge) => edge?.node as RiskFieldsFragment) as Risk[]

  const paginationMeta = {
    totalCount: queryResult.data?.risks?.totalCount ?? 0,
    pageInfo: queryResult?.data?.risks?.pageInfo,
  }

  return {
    ...queryResult,
    risks,
    paginationMeta,
  }
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

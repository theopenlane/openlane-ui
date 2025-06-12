import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_CSV_BULK_RISK, CREATE_RISK, DELETE_RISK, GET_ALL_RISKS, GET_RISK_BY_ID, GET_TABLE_RISKS, UPDATE_RISK } from '@repo/codegen/query/risks'

import {
  CreateBulkCsvRiskMutation,
  CreateBulkCsvRiskMutationVariables,
  CreateRiskMutation,
  CreateRiskMutationVariables,
  DeleteRiskMutation,
  DeleteRiskMutationVariables,
  GetAllRisksQuery,
  GetAllRisksQueryVariables,
  GetRiskByIdQuery,
  GetRiskByIdQueryVariables,
  GetTableRisksQuery,
  Risk,
  RiskFieldsFragment,
  RiskTableFieldsFragment,
  RiskWhereInput,
  UpdateRiskMutation,
  UpdateRiskMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

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
  orderBy?: GetAllRisksQueryVariables['orderBy']
  enabled?: boolean
}

export const useRisksWithFilter = ({ where, pagination, orderBy, enabled = true }: UseRisksWithFilterProps) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: ['risks', { where, pagination, orderBy }],
    queryFn: async () =>
      await client.request<GetAllRisksQuery>(GET_ALL_RISKS, {
        where,
        ...pagination?.query,
        orderBy,
      }),
    enabled,
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

export const useTableRisks = ({ where, pagination, orderBy, enabled = true }: UseRisksWithFilterProps) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery({
    queryKey: ['risks', { where, pagination, orderBy }],
    queryFn: async () =>
      await client.request<GetTableRisksQuery>(GET_TABLE_RISKS, {
        where,
        ...pagination?.query,
        orderBy,
      }),
    enabled,
  })

  const risks = queryResult?.data?.risks?.edges?.map((edge) => edge?.node as RiskTableFieldsFragment) as Risk[]

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

export const useRiskSelect = () => {
  const { risks, ...rest } = useRisksWithFilter({
    where: {},
    enabled: true,
  })

  const riskOptions =
    risks?.map((risk) => ({
      label: risk.name,
      value: risk.id,
    })) ?? []

  return { riskOptions, ...rest }
}

export const useGetRiskById = (riskId: string | null) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetRiskByIdQuery, unknown>({
    queryKey: ['risks', riskId],
    queryFn: async () => {
      if (!riskId) throw new Error('Missing risk ID')
      return client.request<GetRiskByIdQuery, GetRiskByIdQueryVariables>(GET_RISK_BY_ID, { riskId })
    },
    enabled: !!riskId,
  })

  const risk = queryResult?.data?.risk as RiskFieldsFragment

  return {
    ...queryResult,
    risk,
  }
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

export const useCreateBulkCSVRisk = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvRiskMutation, unknown, CreateBulkCsvRiskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_RISK, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
    },
  })
}

export const useDeleteRisk = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteRiskMutation, unknown, DeleteRiskMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(DELETE_RISK, variables)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['risks'] }),
  })
}

export const useCreateRisk = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateRiskMutation, unknown, CreateRiskMutationVariables>({
    mutationFn: async (payload) => {
      return client.request(CREATE_RISK, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
    },
  })
}

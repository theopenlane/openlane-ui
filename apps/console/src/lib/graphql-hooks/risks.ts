import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import {
  BULK_DELETE_RISK,
  BULK_EDIT_RISK,
  CREATE_CSV_BULK_RISK,
  CREATE_RISK,
  DELETE_RISK,
  GET_ALL_RISKS,
  GET_RISK_BY_ID,
  GET_RISK_DISCUSSION_BY_ID,
  GET_RISK_OPEN_AND_IDENTIFIED_COUNT,
  UPDATE_RISK,
  INSERT_RISK_COMMENT,
  UPDATE_RISK_COMMENT,
} from '@repo/codegen/query/risks'

import {
  CreateBulkCsvRiskMutation,
  CreateBulkCsvRiskMutationVariables,
  CreateRiskMutation,
  CreateRiskMutationVariables,
  DeleteBulkRiskMutation,
  DeleteBulkRiskMutationVariables,
  DeleteRiskMutation,
  DeleteRiskMutationVariables,
  GetAllRisksQuery,
  GetAllRisksQueryVariables,
  GetOpenRiskCountQuery,
  GetRiskByIdQuery,
  GetRiskByIdQueryVariables,
  GetRiskDiscussionByIdQuery,
  Risk,
  RiskFieldsFragment,
  RiskWhereInput,
  UpdateBulkRiskMutation,
  UpdateBulkRiskMutationVariables,
  InsertRiskCommentMutation,
  InsertRiskCommentMutationVariables,
  UpdateRiskMutation,
  UpdateRiskMutationVariables,
  UpdateRiskCommentMutation,
  UpdateRiskCommentMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

type UseRisksProps = {
  where?: RiskWhereInput
  pagination?: TPagination
  orderBy?: GetAllRisksQueryVariables['orderBy']
  enabled?: boolean
}

export const useRisks = ({ where, pagination, orderBy, enabled = true }: UseRisksProps) => {
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

export const useRiskSelect = () => {
  const { risks, ...rest } = useRisks({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
    },
  })
}

export const useBulkEditRisk = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkRiskMutation, unknown, UpdateBulkRiskMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_RISK, variables),
    onSuccess: () => {
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

export const useBulkDeleteRisks = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkRiskMutation, unknown, DeleteBulkRiskMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_RISK, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
    },
  })
}

export const useGetRiskOpenAndIdentifiedCount = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetOpenRiskCountQuery, unknown>({
    queryKey: ['risks', 'riskOpenAndIdentifiedCount'],
    queryFn: async () => client.request(GET_RISK_OPEN_AND_IDENTIFIED_COUNT),
    enabled: true,
  })

  return {
    ...queryResult,
    totalCount: queryResult.data?.risks?.totalCount ?? 0,
  }
}

export const RISK_DISCUSSION_QUERY_KEY = 'risksDiscussion'

export const useGetRiskDiscussionById = (riskId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetRiskDiscussionByIdQuery, unknown>({
    queryKey: [RISK_DISCUSSION_QUERY_KEY, riskId],
    queryFn: async () => client.request(GET_RISK_DISCUSSION_BY_ID, { riskId }),
    enabled: !!riskId,
  })
}

export const useInsertRiskComment = () => {
  const { client } = useGraphQLClient()

  return useMutation<InsertRiskCommentMutation, unknown, InsertRiskCommentMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(INSERT_RISK_COMMENT, variables)
    },
  })
}

export const useUpdateRiskComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateRiskCommentMutation, unknown, UpdateRiskCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_RISK_COMMENT, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['riskComments', data.updateRiskComment.risk.id] })
    },
  })
}

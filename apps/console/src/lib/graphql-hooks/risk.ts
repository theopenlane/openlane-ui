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
  GET_RISK_ASSOCIATIONS,
  GET_RISK_COMMENTS,
} from '@repo/codegen/query/risk'

import {
  type CreateBulkCsvRiskMutation,
  type CreateBulkCsvRiskMutationVariables,
  type CreateRiskMutation,
  type CreateRiskMutationVariables,
  type DeleteBulkRiskMutation,
  type DeleteBulkRiskMutationVariables,
  type DeleteRiskMutation,
  type DeleteRiskMutationVariables,
  type GetAllRisksQuery,
  type GetAllRisksQueryVariables,
  type GetOpenRiskCountQuery,
  type GetRiskByIdQuery,
  type GetRiskByIdQueryVariables,
  type GetRiskDiscussionByIdQuery,
  type RiskFieldsFragment,
  type RiskWhereInput,
  type UpdateBulkRiskMutation,
  type UpdateBulkRiskMutationVariables,
  type InsertRiskCommentMutation,
  type InsertRiskCommentMutationVariables,
  type UpdateRiskMutation,
  type UpdateRiskMutationVariables,
  type UpdateRiskCommentMutation,
  type UpdateRiskCommentMutationVariables,
  type GetRiskAssociationsQuery,
  type GetRiskCommentsQuery,
  type GetRiskCommentsQueryVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { useMemo } from 'react'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'
import { useEntityComments } from '@/lib/graphql-hooks/entity-comments'
import { invalidateCreateEdgeTargets, invalidateEdgeUpdateTargets } from '@/components/shared/object-association/object-association-config'

const RISK_COMMENTS_KEY = 'riskComments'

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

  const risks = useMemo(() => queryResult.data?.risks?.edges?.map((edge) => edge?.node).filter((node): node is NonNullable<typeof node> => !!node) ?? [], [queryResult.data])

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
    onSuccess: (_, { input }) => {
      queryClient.invalidateQueries({ queryKey: ['risksDiscussion'] })
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      invalidateEdgeUpdateTargets(input, queryClient)
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
    onSuccess: (_, { input }) => {
      queryClient.invalidateQueries({ queryKey: ['risks'] })
      invalidateCreateEdgeTargets(input, queryClient)
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

export const useGetRiskDiscussionById = (riskId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetRiskDiscussionByIdQuery, unknown>({
    queryKey: ['risksDiscussion', riskId],
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
      queryClient.invalidateQueries({ queryKey: [RISK_COMMENTS_KEY, data.updateRiskComment.risk.id] })
    },
  })
}

export const useRiskComments = (riskId: string | null | undefined) =>
  useEntityComments({
    queryKeyPrefix: RISK_COMMENTS_KEY,
    entityId: riskId,
    fetchComments: async (client, id) => (await client.request<GetRiskCommentsQuery, GetRiskCommentsQueryVariables>(GET_RISK_COMMENTS, { riskId: id })).risk.comments,
    addComment: (client, id, text) => client.request<UpdateRiskMutation, UpdateRiskMutationVariables>(UPDATE_RISK, { updateRiskId: id, input: { addComment: { text } } }),
    editComment: (client, commentId, text) => client.request<UpdateRiskCommentMutation, UpdateRiskCommentMutationVariables>(UPDATE_RISK_COMMENT, { updateRiskCommentId: commentId, input: { text } }),
  })

export const useGetRiskAssociations = (riskId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetRiskAssociationsQuery, unknown>({
    queryKey: ['risks', riskId, 'associations'],
    queryFn: async () => client.request<GetRiskAssociationsQuery>(GET_RISK_ASSOCIATIONS, { riskId: riskId as string }),
    enabled: !!riskId,
  })
}

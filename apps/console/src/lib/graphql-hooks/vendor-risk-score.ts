import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHistoryGraphQLClient } from '@/hooks/useHistoryGraphQLClient'
import { type GetVendorRiskScoreHistoriesQuery, type GetVendorRiskScoreHistoriesQueryVariables } from '@repo/codegen/src/historyschema'
import { GET_VENDOR_RISK_SCORE_HISTORIES } from '@repo/codegen/query-history/vendor-risk-score'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type MutationCreateBulkCsvVendorRiskScoreArgs,
  type CreateVendorRiskScoreMutation,
  type CreateVendorRiskScoreMutationVariables,
  type UpdateVendorRiskScoreMutation,
  type CreateVendorRiskScoreInput,
  type UpdateVendorRiskScoreInput,
  type UpdateBulkCsvVendorRiskScoreMutation,
  type UpdateBulkCsvVendorRiskScoreMutationVariables,
  type MutationDeleteBulkVendorRiskScoreArgs,
  type DeleteVendorRiskScoreMutationVariables,
  type MutationUpdateBulkVendorRiskScoreArgs,
  type UpdateVendorRiskScoreMutationVariables,
  type QueryVendorRiskScoreArgs,
  type QueryVendorRiskScoresArgs,
  type VendorRiskScore,
  type VendorRiskScoreBulkCreatePayload,
  type VendorRiskScoreBulkDeletePayload,
  type VendorRiskScoreBulkUpdatePayload,
  type VendorRiskScoreConnection,
  type VendorRiskScoreDeletePayload,
  type VendorRiskScoringQuery,
  type VendorRiskScoreQuestionUsageQuery,
  type VendorRiskScoringQueryVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_VENDOR_RISK_SCORES,
  GET_VENDOR_RISK_SCORE_QUESTION_USAGE,
  CREATE_VENDOR_RISK_SCORE,
  UPDATE_VENDOR_RISK_SCORE,
  DELETE_VENDOR_RISK_SCORE,
  VENDOR_RISK_SCORE,
  CREATE_CSV_BULK_VENDOR_RISK_SCORE,
  UPDATE_CSV_BULK_VENDOR_RISK_SCORE,
  BULK_EDIT_VENDOR_RISK_SCORE,
  BULK_DELETE_VENDOR_RISK_SCORE,
  GET_VENDOR_RISK_SCORING,
} from '@repo/codegen/query/vendor-risk-score'
import { fetchAllConnectionNodes } from './fetch-all-connection-nodes'
import { chunk } from '@/utils/async'

type VendorRiskScoresWithFilterQuery = {
  vendorRiskScores: VendorRiskScoreConnection
}

type VendorRiskScoresWithFilterQueryVariables = QueryVendorRiskScoresArgs

type DeleteVendorRiskScoreMutation = {
  deleteVendorRiskScore: VendorRiskScoreDeletePayload
}

type VendorRiskScoreQuery = {
  vendorRiskScore: VendorRiskScore
}

type VendorRiskScoreQueryVariables = {
  vendorRiskScoreId: QueryVendorRiskScoreArgs['id']
}

type CreateBulkCsvVendorRiskScoreMutation = {
  createBulkCSVVendorRiskScore: VendorRiskScoreBulkCreatePayload
}

type CreateBulkCsvVendorRiskScoreMutationVariables = MutationCreateBulkCsvVendorRiskScoreArgs

type UpdateBulkVendorRiskScoreMutation = {
  updateBulkVendorRiskScore: VendorRiskScoreBulkUpdatePayload
}

type UpdateBulkVendorRiskScoreMutationVariables = MutationUpdateBulkVendorRiskScoreArgs

type DeleteBulkVendorRiskScoreMutation = {
  deleteBulkVendorRiskScore: VendorRiskScoreBulkDeletePayload
}

type DeleteBulkVendorRiskScoreMutationVariables = MutationDeleteBulkVendorRiskScoreArgs

type GetAllVendorRiskScoresArgs = {
  where?: VendorRiskScoresWithFilterQueryVariables['where']
  orderBy?: VendorRiskScoresWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type VendorRiskScoresNode = NonNullable<NonNullable<NonNullable<VendorRiskScoresWithFilterQuery['vendorRiskScores']>['edges']>[number]>['node']

export type VendorRiskScoresNodeNonNull = NonNullable<VendorRiskScoresNode>

export const useVendorRiskScoresWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllVendorRiskScoresArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<VendorRiskScoresWithFilterQuery, unknown>({
    queryKey: ['vendorRiskScores', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<VendorRiskScoresWithFilterQuery> => {
      const result = await client.request<VendorRiskScoresWithFilterQuery>(GET_ALL_VENDOR_RISK_SCORES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.vendorRiskScores?.edges ?? []

  const vendorRiskScoresNodes: VendorRiskScoresNodeNonNull[] = edges.reduce<VendorRiskScoresNodeNonNull[]>((acc, edge) => {
    if (edge?.node) {
      acc.push(edge.node)
    }
    return acc
  }, [])

  return { ...queryResult, vendorRiskScoresNodes }
}

export type TVendorRiskScoringNode = NonNullable<NonNullable<NonNullable<VendorRiskScoringQuery['vendorRiskScores']['edges']>[number]>['node']>

const VENDOR_RISK_SCORING_PAGE_SIZE = 100

export const useVendorRiskScoring = (entityId: string) => {
  const { client } = useGraphQLClient()
  return useQuery({
    queryKey: ['vendorRiskScores', 'scoring', entityId],
    queryFn: () =>
      fetchAllConnectionNodes<TVendorRiskScoringNode>(async (after) => {
        const data = await client.request<VendorRiskScoringQuery, VendorRiskScoringQueryVariables>(GET_VENDOR_RISK_SCORING, {
          where: { entityID: entityId },
          first: VENDOR_RISK_SCORING_PAGE_SIZE,
          after,
        })
        return data.vendorRiskScores
      }),
    enabled: !!entityId,
    placeholderData: undefined,
  })
}

export const useCreateVendorRiskScore = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateVendorRiskScoreMutation, unknown, CreateVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_VENDOR_RISK_SCORE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export const useUpdateVendorRiskScore = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateVendorRiskScoreMutation, unknown, UpdateVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_VENDOR_RISK_SCORE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export const useDeleteVendorRiskScore = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteVendorRiskScoreMutation, unknown, DeleteVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_VENDOR_RISK_SCORE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export const useVendorRiskScore = (vendorRiskScoreId?: VendorRiskScoreQueryVariables['vendorRiskScoreId']) => {
  const { client } = useGraphQLClient()
  return useQuery<VendorRiskScoreQuery, unknown>({
    queryKey: ['vendorRiskScores', vendorRiskScoreId],
    queryFn: async (): Promise<VendorRiskScoreQuery> => {
      const result = await client.request(VENDOR_RISK_SCORE, { vendorRiskScoreId })
      return result as VendorRiskScoreQuery
    },
    enabled: !!vendorRiskScoreId,
  })
}

export const useCreateBulkCSVVendorRiskScore = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvVendorRiskScoreMutation, unknown, CreateBulkCsvVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_VENDOR_RISK_SCORE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export const useBulkEditVendorRiskScore = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkVendorRiskScoreMutation, unknown, UpdateBulkVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_VENDOR_RISK_SCORE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export const useBulkDeleteVendorRiskScore = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkVendorRiskScoreMutation, unknown, DeleteBulkVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_VENDOR_RISK_SCORE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export const useVendorRiskScoreQuestionUsage = (questionKey: string | undefined) => {
  const { client } = useGraphQLClient()
  const query = useQuery({
    queryKey: ['vendorRiskScores', 'questionUsage', questionKey],
    queryFn: () => client.request<VendorRiskScoreQuestionUsageQuery>(GET_VENDOR_RISK_SCORE_QUESTION_USAGE, { questionKey }),
    enabled: !!questionKey,
    placeholderData: undefined,
  })

  return { ...query, answerCount: query.data?.vendorRiskScores.totalCount }
}

export const useLinkUnconfiguredVendorRiskScores = () => {
  const { client } = useGraphQLClient()
  return async (vendorScoringConfigID: string) => {
    const scores = await fetchAllConnectionNodes<{ id: string }>(async (after) => {
      const data = await client.request<VendorRiskScoresWithFilterQuery>(GET_ALL_VENDOR_RISK_SCORES, {
        where: { vendorScoringConfigIDIsNil: true },
        first: VENDOR_RISK_SCORING_PAGE_SIZE,
        after,
      })
      return data.vendorRiskScores
    })
    for (const ids of chunk(
      scores.map((score) => score.id),
      VENDOR_RISK_SCORING_PAGE_SIZE,
    )) {
      await client.request<UpdateBulkVendorRiskScoreMutation, UpdateBulkVendorRiskScoreMutationVariables>(BULK_EDIT_VENDOR_RISK_SCORE, { ids, input: { vendorScoringConfigID } })
    }
  }
}

type TSaveVendorRiskAnswerVariables = { kind: 'create'; input: CreateVendorRiskScoreInput } | { kind: 'update'; id: string; input: UpdateVendorRiskScoreInput }

export const useSaveVendorRiskAnswer = (entityId: string) => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<TVendorRiskScoringNode, unknown, TSaveVendorRiskAnswerVariables>({
    mutationFn: async (variables) => {
      if (variables.kind === 'create') {
        const data = await client.request<CreateVendorRiskScoreMutation, CreateVendorRiskScoreMutationVariables>(CREATE_VENDOR_RISK_SCORE, { input: variables.input })
        return data.createVendorRiskScore.vendorRiskScore
      }
      const data = await client.request<UpdateVendorRiskScoreMutation, UpdateVendorRiskScoreMutationVariables>(UPDATE_VENDOR_RISK_SCORE, {
        updateVendorRiskScoreId: variables.id,
        input: variables.input,
      })
      return data.updateVendorRiskScore.vendorRiskScore
    },
    onSuccess: (saved, variables) => {
      queryClient.setQueryData<TVendorRiskScoringNode[]>(['vendorRiskScores', 'scoring', entityId], (current) =>
        current?.some((score) => score.id === saved.id) ? current.map((score) => (score.id === saved.id ? saved : score)) : [...(current ?? []), saved],
      )
      if (variables.kind === 'update') queryClient.invalidateQueries({ queryKey: ['vendorRiskScoreHistories', entityId] })
    },
  })
}

export const useUpdateBulkCSVVendorRiskScore = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkCsvVendorRiskScoreMutation, unknown, UpdateBulkCsvVendorRiskScoreMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: UPDATE_CSV_BULK_VENDOR_RISK_SCORE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorRiskScores'] })
    },
  })
}

export type TVendorRiskScoreHistoryNode = NonNullable<NonNullable<NonNullable<GetVendorRiskScoreHistoriesQuery['vendorRiskScoreHistories']['edges']>[number]>['node']>

const HISTORY_FETCH_LIMIT = 500

export const useVendorRiskScoreHistories = (entityId: string, refs: readonly string[], enabled: boolean) => {
  const { client } = useHistoryGraphQLClient()
  const sortedRefs = useMemo(() => [...refs].sort(), [refs])
  return useQuery({
    queryKey: ['vendorRiskScoreHistories', entityId, sortedRefs],
    queryFn: () =>
      fetchAllConnectionNodes<TVendorRiskScoreHistoryNode>(async (after) => {
        const data = await client.request<GetVendorRiskScoreHistoriesQuery, GetVendorRiskScoreHistoriesQueryVariables>(GET_VENDOR_RISK_SCORE_HISTORIES, {
          where: { refIn: sortedRefs },
          first: VENDOR_RISK_SCORING_PAGE_SIZE,
          after,
        })
        return data.vendorRiskScoreHistories
      }, HISTORY_FETCH_LIMIT),
    enabled: enabled && sortedRefs.length > 0,
    placeholderData: undefined,
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type MutationCreateBulkCsvVendorRiskScoreArgs,
  type MutationCreateVendorRiskScoreArgs,
  type MutationDeleteBulkVendorRiskScoreArgs,
  type MutationDeleteVendorRiskScoreArgs,
  type MutationUpdateBulkVendorRiskScoreArgs,
  type MutationUpdateVendorRiskScoreArgs,
  type QueryVendorRiskScoreArgs,
  type QueryVendorRiskScoresArgs,
  type VendorRiskScore,
  type VendorRiskScoreBulkCreatePayload,
  type VendorRiskScoreBulkDeletePayload,
  type VendorRiskScoreBulkUpdatePayload,
  type VendorRiskScoreConnection,
  type VendorRiskScoreCreatePayload,
  type VendorRiskScoreDeletePayload,
  type VendorRiskScoreUpdatePayload,
  type VendorRiskScoringQuery,
  type VendorRiskScoringQueryVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_VENDOR_RISK_SCORES,
  CREATE_VENDOR_RISK_SCORE,
  UPDATE_VENDOR_RISK_SCORE,
  DELETE_VENDOR_RISK_SCORE,
  VENDOR_RISK_SCORE,
  CREATE_CSV_BULK_VENDOR_RISK_SCORE,
  BULK_EDIT_VENDOR_RISK_SCORE,
  BULK_DELETE_VENDOR_RISK_SCORE,
  GET_VENDOR_RISK_SCORING,
} from '@repo/codegen/query/vendor-risk-score'
import { fetchAllConnectionNodes } from './fetch-all-connection-nodes'

type VendorRiskScoresWithFilterQuery = {
  vendorRiskScores: VendorRiskScoreConnection
}

type VendorRiskScoresWithFilterQueryVariables = QueryVendorRiskScoresArgs

type CreateVendorRiskScoreMutation = {
  createVendorRiskScore: VendorRiskScoreCreatePayload
}

type CreateVendorRiskScoreMutationVariables = MutationCreateVendorRiskScoreArgs

type UpdateVendorRiskScoreMutation = {
  updateVendorRiskScore: VendorRiskScoreUpdatePayload
}

type UpdateVendorRiskScoreMutationVariables = MutationUpdateVendorRiskScoreArgs

type DeleteVendorRiskScoreMutation = {
  deleteVendorRiskScore: VendorRiskScoreDeletePayload
}

type DeleteVendorRiskScoreMutationVariables = MutationDeleteVendorRiskScoreArgs

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

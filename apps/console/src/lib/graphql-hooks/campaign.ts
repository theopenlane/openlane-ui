import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type CampaignsWithFilterQuery,
  type CampaignsWithFilterQueryVariables,
  type CreateCampaignMutation,
  type CreateCampaignMutationVariables,
  type UpdateCampaignMutation,
  type UpdateCampaignMutationVariables,
  type DeleteCampaignMutation,
  type DeleteCampaignMutationVariables,
  type CampaignQuery,
  type CampaignQueryVariables,
  type CreateCampaignInput,
  type CreateCampaignTargetInput,
  type SendCampaignTestEmailInput,
  type ResendCampaignIncompleteInput,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_CAMPAIGNS,
  CREATE_CAMPAIGN,
  CREATE_CAMPAIGN_WITH_TARGETS,
  UPDATE_CAMPAIGN,
  DELETE_CAMPAIGN,
  CAMPAIGN,
  SEND_CAMPAIGN_TEST_EMAIL,
  RESEND_CAMPAIGN_INCOMPLETE_TARGETS,
} from '@repo/codegen/query/campaign'

type GetAllCampaignsArgs = {
  where?: CampaignsWithFilterQueryVariables['where']
  orderBy?: CampaignsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type CampaignsNode = NonNullable<NonNullable<NonNullable<CampaignsWithFilterQuery['campaigns']>['edges']>[number]>['node']

export type CampaignsNodeNonNull = NonNullable<CampaignsNode>

export const useCampaignsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllCampaignsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<CampaignsWithFilterQuery, unknown>({
    queryKey: ['campaigns', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<CampaignsWithFilterQuery> => {
      const result = await client.request<CampaignsWithFilterQuery>(GET_ALL_CAMPAIGNS, { where, orderBy, ...pagination?.query })
      return result as CampaignsWithFilterQuery
    },
    enabled,
  })

  const edges = queryResult.data?.campaigns?.edges ?? []

  const CampaignsNodes: CampaignsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as CampaignsNodeNonNull)

  return { ...queryResult, CampaignsNodes, isLoading: queryResult.isPending }
}

export const useCreateCampaign = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateCampaignMutation, unknown, CreateCampaignMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CAMPAIGN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export type CampaignWithTargetsTargetInput = Omit<CreateCampaignTargetInput, 'campaignID'>

type CreateCampaignWithTargetsMutation = { createCampaignWithTargets: { campaign: { id: string } } }
type CreateCampaignWithTargetsMutationVariables = { input: { campaign: CreateCampaignInput; targets?: CampaignWithTargetsTargetInput[] } }

export const useCreateCampaignWithTargets = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateCampaignWithTargetsMutation, unknown, CreateCampaignWithTargetsMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CAMPAIGN_WITH_TARGETS, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useUpdateCampaign = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateCampaignMutation, unknown, UpdateCampaignMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CAMPAIGN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useDeleteCampaign = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteCampaignMutation, unknown, DeleteCampaignMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CAMPAIGN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

type SendCampaignTestEmailMutation = { sendCampaignTestEmail: { queuedCount: number; skippedCount: number } }
type SendCampaignTestEmailMutationVariables = { input: SendCampaignTestEmailInput }

export const useSendCampaignTestEmail = () => {
  const { client } = useGraphQLClient()
  return useMutation<SendCampaignTestEmailMutation, unknown, SendCampaignTestEmailMutationVariables>({
    mutationFn: async (variables) => client.request(SEND_CAMPAIGN_TEST_EMAIL, variables),
  })
}

type ResendCampaignIncompleteTargetsMutation = { resendCampaignIncompleteTargets: { queuedCount: number; skippedCount: number } }
type ResendCampaignIncompleteTargetsMutationVariables = { input: ResendCampaignIncompleteInput }

export const useResendCampaignIncompleteTargets = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<ResendCampaignIncompleteTargetsMutation, unknown, ResendCampaignIncompleteTargetsMutationVariables>({
    mutationFn: async (variables) => client.request(RESEND_CAMPAIGN_INCOMPLETE_TARGETS, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargetStats'] })
    },
  })
}

export const useCampaign = (campaignId?: CampaignQueryVariables['campaignId']) => {
  const { client } = useGraphQLClient()
  return useQuery<CampaignQuery, unknown>({
    queryKey: ['campaigns', campaignId],
    queryFn: async (): Promise<CampaignQuery> => {
      const result = await client.request(CAMPAIGN, { campaignId })
      return result as CampaignQuery
    },
    enabled: !!campaignId,
  })
}

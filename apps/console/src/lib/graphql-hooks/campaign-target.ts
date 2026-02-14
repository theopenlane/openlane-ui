import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CampaignTarget,
  CampaignTargetQuery,
  CampaignTargetQueryVariables,
  CampaignTargetsWithFilterQuery,
  CampaignTargetsWithFilterQueryVariables,
  CreateCampaignTargetMutation,
  CreateCampaignTargetMutationVariables,
  DeleteCampaignTargetMutation,
  DeleteCampaignTargetMutationVariables,
  UpdateCampaignTargetMutation,
  UpdateCampaignTargetMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { CAMPAIGN_TARGET, GET_ALL_CAMPAIGN_TARGETS, CREATE_CAMPAIGN_TARGET, DELETE_CAMPAIGN_TARGET, UPDATE_CAMPAIGN_TARGET } from '@repo/codegen/query/campaign-target'

type GetAllCampaignTargetsArgs = {
  where?: CampaignTargetsWithFilterQueryVariables['where']
  orderBy?: CampaignTargetsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useCampaignTargetsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllCampaignTargetsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<CampaignTargetsWithFilterQuery, unknown>({
    queryKey: ['campaignTargets', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<CampaignTargetsWithFilterQuery> => {
      const result = await client.request(GET_ALL_CAMPAIGN_TARGETS, { where, orderBy, ...pagination?.query })
      return result as CampaignTargetsWithFilterQuery
    },
    enabled,
  })

  const CampaignTargets = (queryResult.data?.campaignTargets?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as CampaignTarget[]

  return { ...queryResult, CampaignTargets }
}

export const useCreateCampaignTarget = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateCampaignTargetMutation, unknown, CreateCampaignTargetMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CAMPAIGN_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
    },
  })
}

export const useUpdateCampaignTarget = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateCampaignTargetMutation, unknown, UpdateCampaignTargetMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CAMPAIGN_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
    },
  })
}

export const useDeleteCampaignTarget = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteCampaignTargetMutation, unknown, DeleteCampaignTargetMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_CAMPAIGN_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
    },
  })
}

export const useCampaignTarget = (campaignTargetId?: CampaignTargetQueryVariables['campaignTargetId']) => {
  const { client } = useGraphQLClient()

  return useQuery<CampaignTargetQuery, unknown>({
    queryKey: ['campaignTargets', campaignTargetId],
    queryFn: async (): Promise<CampaignTargetQuery> => {
      const result = await client.request(CAMPAIGN_TARGET, { campaignTargetId })
      return result as CampaignTargetQuery
    },
    enabled: !!campaignTargetId,
  })
}

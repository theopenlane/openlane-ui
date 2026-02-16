import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Campaign,
  CampaignQuery,
  CampaignQueryVariables,
  CampaignsWithFilterQuery,
  CampaignsWithFilterQueryVariables,
  CreateCampaignMutation,
  CreateCampaignMutationVariables,
  DeleteCampaignMutation,
  DeleteCampaignMutationVariables,
  UpdateCampaignMutation,
  UpdateCampaignMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { CAMPAIGN, GET_ALL_CAMPAIGNS, CREATE_CAMPAIGN, DELETE_CAMPAIGN, UPDATE_CAMPAIGN } from '@repo/codegen/query/campaign'

type GetAllCampaignsArgs = {
  where?: CampaignsWithFilterQueryVariables['where']
  orderBy?: CampaignsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useCampaignsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllCampaignsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<CampaignsWithFilterQuery, unknown>({
    queryKey: ['campaigns', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<CampaignsWithFilterQuery> => {
      const result = await client.request(GET_ALL_CAMPAIGNS, { where, orderBy, ...pagination?.query })
      return result as CampaignsWithFilterQuery
    },
    enabled,
  })

  const Campaigns = (queryResult.data?.campaigns?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Campaign[]

  return { ...queryResult, Campaigns }
}

export const useCreateCampaign = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateCampaignMutation, unknown, CreateCampaignMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_CAMPAIGN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { MS_PER_DAY } from '@/utils/date'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CampaignCampaignStatus,
  type CampaignWhereInput,
  type CampaignSummaryQuery,
  type CampaignSummaryQueryVariables,
  type UpcomingCampaignFieldsFragment,
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
  type CreateCampaignWithTargetsMutation,
  type CreateCampaignWithTargetsMutationVariables,
  type CreateCampaignInput,
  type CreateCampaignTargetInput,
  type LaunchCampaignMutation,
  type LaunchCampaignMutationVariables,
  type SendCampaignTestEmailMutation,
  type SendCampaignTestEmailMutationVariables,
  type ResendCampaignIncompleteTargetsMutation,
  type ResendCampaignIncompleteTargetsMutationVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_CAMPAIGNS,
  CREATE_CAMPAIGN,
  CREATE_CAMPAIGN_WITH_TARGETS,
  UPDATE_CAMPAIGN,
  DELETE_CAMPAIGN,
  CAMPAIGN,
  GET_CAMPAIGN_SUMMARY,
  LAUNCH_CAMPAIGN,
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

type CreateCampaignWithOptionalTargetsVariables = {
  campaign: CreateCampaignInput
  targets?: CreateCampaignTargetInput[]
}

export const useCreateCampaignWithOptionalTargets = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<string, unknown, CreateCampaignWithOptionalTargetsVariables>({
    mutationFn: async ({ campaign, targets }) => {
      if (targets?.length) {
        const variables: CreateCampaignWithTargetsMutationVariables = { input: { campaign, targets } }
        const result = await client.request<CreateCampaignWithTargetsMutation, CreateCampaignWithTargetsMutationVariables>(CREATE_CAMPAIGN_WITH_TARGETS, variables)
        return result.createCampaignWithTargets.campaign.id
      }

      const variables: CreateCampaignMutationVariables = { input: campaign }
      const result = await client.request<CreateCampaignMutation, CreateCampaignMutationVariables>(CREATE_CAMPAIGN, variables)
      return result.createCampaign.campaign.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargetStats'] })
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

export const useLaunchCampaign = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<LaunchCampaignMutation, unknown, LaunchCampaignMutationVariables>({
    mutationFn: async (variables) => client.request(LAUNCH_CAMPAIGN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargets'] })
      queryClient.invalidateQueries({ queryKey: ['campaignTargetStats'] })
    },
  })
}

export const useSendCampaignTestEmail = () => {
  const { client } = useGraphQLClient()
  return useMutation<SendCampaignTestEmailMutation, unknown, SendCampaignTestEmailMutationVariables>({
    mutationFn: async (variables) => client.request(SEND_CAMPAIGN_TEST_EMAIL, variables),
  })
}

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

export const CAMPAIGN_TERMINAL_STATUSES: readonly CampaignCampaignStatus[] = [CampaignCampaignStatus.COMPLETED, CampaignCampaignStatus.CANCELED]
export const COMPLETED_RECENTLY_WINDOW_DAYS = 30
export const UPCOMING_CAMPAIGN_COUNT = 3
const ACTIVE_RECIPIENTS_PAGE_SIZE = 100
const SUMMARY_CLOCK_BUCKET_MS = 5 * 60 * 1000
const SUMMARY_STALE_TIME_MS = 5 * 60 * 1000

export type TCampaignSummaryScope = 'active' | 'needsAttention' | 'completedRecently'

export type TUpcomingCampaignKind = 'LAUNCH' | 'RUN'

export type TUpcomingCampaign = Pick<UpcomingCampaignFieldsFragment, 'id' | 'name' | 'campaignType' | 'recipientCount'> & {
  date: string
  kind: TUpcomingCampaignKind
}

export type TCampaignSummary = {
  totalCampaignCount: number
  activeCount: number
  activeRecipientCount: number
  activeRecipientCountIsPartial: boolean
  needsAttentionCount: number
  overdueCount: number
  scheduledOverdueCount: number
  completedRecentlyCount: number
  upcoming: TUpcomingCampaign[]
}

const upcomingKindDateFields: Record<TUpcomingCampaignKind, 'scheduledAt' | 'nextRunAt'> = {
  LAUNCH: 'scheduledAt',
  RUN: 'nextRunAt',
}

const buildCampaignSummaryVariables = (now: Date): CampaignSummaryQueryVariables => {
  const nowIso = now.toISOString()
  const completedSince = new Date(now.getTime() - COMPLETED_RECENTLY_WINDOW_DAYS * MS_PER_DAY).toISOString()

  const overdueWhere: CampaignWhereInput = { isActive: true, statusNotIn: [CampaignCampaignStatus.DRAFT, ...CAMPAIGN_TERMINAL_STATUSES], dueDateLT: nowIso, completedAtIsNil: true }
  const scheduledOverdueWhere: CampaignWhereInput = { status: CampaignCampaignStatus.SCHEDULED, scheduledAtLT: nowIso, launchedAtIsNil: true }

  return {
    activeWhere: { isActive: true, statusNotIn: [...CAMPAIGN_TERMINAL_STATUSES] },
    overdueWhere,
    scheduledOverdueWhere,
    needsAttentionWhere: { or: [overdueWhere, scheduledOverdueWhere] },
    completedRecentlyWhere: { completedAtGTE: completedSince, completedAtLTE: nowIso },
    upcomingScheduledWhere: { status: CampaignCampaignStatus.SCHEDULED, scheduledAtGTE: nowIso, launchedAtIsNil: true },
    upcomingRecurringWhere: { isRecurring: true, nextRunAtGTE: nowIso, statusIn: [CampaignCampaignStatus.SCHEDULED, CampaignCampaignStatus.ACTIVE] },
    activeFirst: ACTIVE_RECIPIENTS_PAGE_SIZE,
    upcomingFirst: UPCOMING_CAMPAIGN_COUNT,
  }
}

type TUpcomingCampaignEdges = NonNullable<CampaignSummaryQuery['upcomingScheduledCampaigns']>['edges']

const toUpcomingCampaigns = (edges: TUpcomingCampaignEdges, kind: TUpcomingCampaignKind): TUpcomingCampaign[] =>
  (edges ?? []).flatMap((edge) => {
    const node = edge?.node
    const date = node?.[upcomingKindDateFields[kind]]

    if (!node || !date) {
      return []
    }

    return [{ id: node.id, name: node.name, campaignType: node.campaignType, recipientCount: node.recipientCount, date, kind }]
  })

const takeNextCampaigns = (campaigns: TUpcomingCampaign[]): TUpcomingCampaign[] =>
  [...campaigns]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((campaign, index, all) => all.findIndex((other) => other.id === campaign.id) === index)
    .slice(0, UPCOMING_CAMPAIGN_COUNT)

export const useCampaignSummary = () => {
  const { client } = useGraphQLClient()

  const [clockBucket, setClockBucket] = useState(() => Math.floor(Date.now() / SUMMARY_CLOCK_BUCKET_MS))

  useEffect(() => {
    const intervalId = setInterval(() => setClockBucket(Math.floor(Date.now() / SUMMARY_CLOCK_BUCKET_MS)), SUMMARY_CLOCK_BUCKET_MS)
    return () => clearInterval(intervalId)
  }, [])

  const variables = useMemo(() => buildCampaignSummaryVariables(new Date(clockBucket * SUMMARY_CLOCK_BUCKET_MS)), [clockBucket])

  const { data, isPending, error } = useQuery<CampaignSummaryQuery, unknown>({
    queryKey: ['campaigns', 'summary', variables],
    queryFn: async (): Promise<CampaignSummaryQuery> => client.request<CampaignSummaryQuery>(GET_CAMPAIGN_SUMMARY, variables),
    staleTime: SUMMARY_STALE_TIME_MS,
  })

  const summary = useMemo<TCampaignSummary | undefined>(() => {
    if (!data) {
      return undefined
    }

    const activeEdges = data.activeCampaigns.edges ?? []
    const activeRecipientCount = activeEdges.reduce((total, edge) => total + (edge?.node?.recipientCount ?? 0), 0)

    const upcoming = takeNextCampaigns([...toUpcomingCampaigns(data.upcomingScheduledCampaigns.edges, 'LAUNCH'), ...toUpcomingCampaigns(data.upcomingRecurringCampaigns.edges, 'RUN')])

    return {
      totalCampaignCount: data.allCampaigns.totalCount,
      activeCount: data.activeCampaigns.totalCount,
      activeRecipientCount,
      activeRecipientCountIsPartial: data.activeCampaigns.totalCount > activeEdges.length,
      needsAttentionCount: data.needsAttentionCampaigns.totalCount,
      overdueCount: data.overdueCampaigns.totalCount,
      scheduledOverdueCount: data.scheduledOverdueCampaigns.totalCount,
      completedRecentlyCount: data.completedRecentlyCampaigns.totalCount,
      upcoming,
    }
  }, [data])

  const scopeFilters = useMemo(
    () => ({
      active: variables.activeWhere,
      needsAttention: variables.needsAttentionWhere,
      completedRecently: variables.completedRecentlyWhere,
    }),
    [variables],
  )

  return { summary, scopeFilters, isLoading: isPending, error }
}

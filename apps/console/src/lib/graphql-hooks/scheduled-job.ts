import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type ScheduledJobsWithFilterQuery,
  type ScheduledJobsWithFilterQueryVariables,
  type CreateScheduledJobMutation,
  type CreateScheduledJobMutationVariables,
  type UpdateScheduledJobMutation,
  type UpdateScheduledJobMutationVariables,
  type DeleteScheduledJobMutation,
  type DeleteScheduledJobMutationVariables,
  type ScheduledJobQuery,
  type ScheduledJobQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_SCHEDULED_JOBS, CREATE_SCHEDULED_JOB, UPDATE_SCHEDULED_JOB, DELETE_SCHEDULED_JOB, SCHEDULED_JOB } from '@repo/codegen/query/scheduled-job'

type GetAllScheduledJobsArgs = {
  where?: ScheduledJobsWithFilterQueryVariables['where']
  orderBy?: ScheduledJobsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type ScheduledJobsNode = NonNullable<NonNullable<NonNullable<ScheduledJobsWithFilterQuery['scheduledJobs']>['edges']>[number]>['node']

export type ScheduledJobsNodeNonNull = NonNullable<ScheduledJobsNode>

export const useScheduledJobsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllScheduledJobsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<ScheduledJobsWithFilterQuery, unknown>({
    queryKey: ['scheduledJobs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ScheduledJobsWithFilterQuery> => {
      const result = await client.request<ScheduledJobsWithFilterQuery>(GET_ALL_SCHEDULED_JOBS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.scheduledJobs?.edges ?? []

  const scheduledJobsNodes: ScheduledJobsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as ScheduledJobsNodeNonNull)

  return { ...queryResult, scheduledJobsNodes }
}

export const useCreateScheduledJob = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateScheduledJobMutation, unknown, CreateScheduledJobMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SCHEDULED_JOB, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] })
    },
  })
}

export const useUpdateScheduledJob = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateScheduledJobMutation, unknown, UpdateScheduledJobMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SCHEDULED_JOB, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] })
    },
  })
}

export const useDeleteScheduledJob = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteScheduledJobMutation, unknown, DeleteScheduledJobMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SCHEDULED_JOB, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobs'] })
    },
  })
}

export const useScheduledJob = (scheduledJobId?: ScheduledJobQueryVariables['scheduledJobId']) => {
  const { client } = useGraphQLClient()
  return useQuery<ScheduledJobQuery, unknown>({
    queryKey: ['scheduledJobs', scheduledJobId],
    queryFn: async (): Promise<ScheduledJobQuery> => {
      const result = await client.request(SCHEDULED_JOB, { scheduledJobId })
      return result as ScheduledJobQuery
    },
    enabled: !!scheduledJobId,
  })
}

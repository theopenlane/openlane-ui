import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  ScheduledJob,
  ScheduledJobQuery,
  ScheduledJobQueryVariables,
  ScheduledJobsWithFilterQuery,
  ScheduledJobsWithFilterQueryVariables,
  CreateScheduledJobMutation,
  CreateScheduledJobMutationVariables,
  DeleteScheduledJobMutation,
  DeleteScheduledJobMutationVariables,
  UpdateScheduledJobMutation,
  UpdateScheduledJobMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { SCHEDULED_JOB, GET_ALL_SCHEDULED_JOBS, CREATE_SCHEDULED_JOB, DELETE_SCHEDULED_JOB, UPDATE_SCHEDULED_JOB } from '@repo/codegen/query/scheduled-job'

type GetAllScheduledJobsArgs = {
  where?: ScheduledJobsWithFilterQueryVariables['where']
  orderBy?: ScheduledJobsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useScheduledJobsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllScheduledJobsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ScheduledJobsWithFilterQuery, unknown>({
    queryKey: ['scheduledJobs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ScheduledJobsWithFilterQuery> => {
      const result = await client.request(GET_ALL_SCHEDULED_JOBS, { where, orderBy, ...pagination?.query })
      return result as ScheduledJobsWithFilterQuery
    },
    enabled,
  })

  const ScheduledJobs = (queryResult.data?.scheduledJobs?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as ScheduledJob[]

  return { ...queryResult, ScheduledJobs }
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

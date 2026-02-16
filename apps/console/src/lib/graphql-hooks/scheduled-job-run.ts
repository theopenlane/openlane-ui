import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  ScheduledJobRun,
  ScheduledJobRunQuery,
  ScheduledJobRunQueryVariables,
  ScheduledJobRunsWithFilterQuery,
  ScheduledJobRunsWithFilterQueryVariables,
  CreateScheduledJobRunMutation,
  CreateScheduledJobRunMutationVariables,
  DeleteScheduledJobRunMutation,
  DeleteScheduledJobRunMutationVariables,
  UpdateScheduledJobRunMutation,
  UpdateScheduledJobRunMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { SCHEDULED_JOB_RUN, GET_ALL_SCHEDULED_JOB_RUNS, CREATE_SCHEDULED_JOB_RUN, DELETE_SCHEDULED_JOB_RUN, UPDATE_SCHEDULED_JOB_RUN } from '@repo/codegen/query/scheduled-job-run'

type GetAllScheduledJobRunsArgs = {
  where?: ScheduledJobRunsWithFilterQueryVariables['where']
  orderBy?: ScheduledJobRunsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useScheduledJobRunsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllScheduledJobRunsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<ScheduledJobRunsWithFilterQuery, unknown>({
    queryKey: ['scheduledJobRuns', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<ScheduledJobRunsWithFilterQuery> => {
      const result = await client.request(GET_ALL_SCHEDULED_JOB_RUNS, { where, orderBy, ...pagination?.query })
      return result as ScheduledJobRunsWithFilterQuery
    },
    enabled,
  })

  const ScheduledJobRuns = (queryResult.data?.scheduledJobRuns?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as ScheduledJobRun[]

  return { ...queryResult, ScheduledJobRuns }
}

export const useCreateScheduledJobRun = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateScheduledJobRunMutation, unknown, CreateScheduledJobRunMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SCHEDULED_JOB_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobRuns'] })
    },
  })
}

export const useUpdateScheduledJobRun = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateScheduledJobRunMutation, unknown, UpdateScheduledJobRunMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SCHEDULED_JOB_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobRuns'] })
    },
  })
}

export const useDeleteScheduledJobRun = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteScheduledJobRunMutation, unknown, DeleteScheduledJobRunMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SCHEDULED_JOB_RUN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledJobRuns'] })
    },
  })
}

export const useScheduledJobRun = (scheduledJobRunId?: ScheduledJobRunQueryVariables['scheduledJobRunId']) => {
  const { client } = useGraphQLClient()

  return useQuery<ScheduledJobRunQuery, unknown>({
    queryKey: ['scheduledJobRuns', scheduledJobRunId],
    queryFn: async (): Promise<ScheduledJobRunQuery> => {
      const result = await client.request(SCHEDULED_JOB_RUN, { scheduledJobRunId })
      return result as ScheduledJobRunQuery
    },
    enabled: !!scheduledJobRunId,
  })
}

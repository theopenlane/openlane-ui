import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type JobRunnersWithFilterQuery,
  type JobRunnersWithFilterQueryVariables,
  type CreateJobRunnerMutation,
  type CreateJobRunnerMutationVariables,
  type UpdateJobRunnerMutation,
  type UpdateJobRunnerMutationVariables,
  type DeleteJobRunnerMutation,
  type DeleteJobRunnerMutationVariables,
  type JobRunnerQuery,
  type JobRunnerQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_JOB_RUNNERS, CREATE_JOB_RUNNER, UPDATE_JOB_RUNNER, DELETE_JOB_RUNNER, JOB_RUNNER } from '@repo/codegen/query/job-runner'

type GetAllJobRunnersArgs = {
  where?: JobRunnersWithFilterQueryVariables['where']
  orderBy?: JobRunnersWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type JobRunnersNode = NonNullable<NonNullable<NonNullable<JobRunnersWithFilterQuery['jobRunners']>['edges']>[number]>['node']

export type JobRunnersNodeNonNull = NonNullable<JobRunnersNode>

export const useJobRunnersWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllJobRunnersArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<JobRunnersWithFilterQuery, unknown>({
    queryKey: ['jobRunners', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<JobRunnersWithFilterQuery> => {
      const result = await client.request<JobRunnersWithFilterQuery>(GET_ALL_JOB_RUNNERS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.jobRunners?.edges ?? []

  const jobRunnersNodes: JobRunnersNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as JobRunnersNodeNonNull)

  return { ...queryResult, jobRunnersNodes }
}

export const useCreateJobRunner = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateJobRunnerMutation, unknown, CreateJobRunnerMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_JOB_RUNNER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunners'] })
    },
  })
}

export const useUpdateJobRunner = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateJobRunnerMutation, unknown, UpdateJobRunnerMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_JOB_RUNNER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunners'] })
    },
  })
}

export const useDeleteJobRunner = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteJobRunnerMutation, unknown, DeleteJobRunnerMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_JOB_RUNNER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunners'] })
    },
  })
}

export const useJobRunner = (jobRunnerId?: JobRunnerQueryVariables['jobRunnerId']) => {
  const { client } = useGraphQLClient()
  return useQuery<JobRunnerQuery, unknown>({
    queryKey: ['jobRunners', jobRunnerId],
    queryFn: async (): Promise<JobRunnerQuery> => {
      const result = await client.request(JOB_RUNNER, { jobRunnerId })
      return result as JobRunnerQuery
    },
    enabled: !!jobRunnerId,
  })
}

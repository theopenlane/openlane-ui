import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  JobRunnerRegistrationTokensWithFilterQuery,
  JobRunnerRegistrationTokensWithFilterQueryVariables,
  JobRunnerRegistrationToken,
  CreateJobRunnerRegistrationTokenMutation,
  CreateJobRunnerRegistrationTokenMutationVariables,
  DeleteJobRunnerRegistrationTokenMutation,
  DeleteJobRunnerRegistrationTokenMutationVariables,
  JobRunnerRegistrationTokenQuery,
  JobRunnerRegistrationTokenQueryVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_JOB_RUNNER_REGISTRATION_TOKENS,
  CREATE_JOB_RUNNER_REGISTRATION_TOKEN,
  DELETE_JOB_RUNNER_REGISTRATION_TOKEN,
  JOB_RUNNER_REGISTRATION_TOKEN,
} from '@repo/codegen/query/job-runner-registration-token'

type GetAllJobRunnerRegistrationTokensArgs = {
  where?: JobRunnerRegistrationTokensWithFilterQueryVariables['where']
  orderBy?: JobRunnerRegistrationTokensWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useJobRunnerRegistrationTokensWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllJobRunnerRegistrationTokensArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<JobRunnerRegistrationTokensWithFilterQuery, unknown>({
    queryKey: ['jobRunnerRegistrationTokens', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<JobRunnerRegistrationTokensWithFilterQuery> => {
      const result = await client.request(GET_ALL_JOB_RUNNER_REGISTRATION_TOKENS, { where, orderBy, ...pagination?.query })
      return result as JobRunnerRegistrationTokensWithFilterQuery
    },
    enabled,
  })
  const JobRunnerRegistrationTokens = (queryResult.data?.jobRunnerRegistrationTokens?.edges?.map((edge) => ({ ...edge?.node })) ?? []) as JobRunnerRegistrationToken[]
  return { ...queryResult, JobRunnerRegistrationTokens }
}

export const useCreateJobRunnerRegistrationToken = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateJobRunnerRegistrationTokenMutation, unknown, CreateJobRunnerRegistrationTokenMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_JOB_RUNNER_REGISTRATION_TOKEN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunnerRegistrationTokens'] })
    },
  })
}

export const useDeleteJobRunnerRegistrationToken = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteJobRunnerRegistrationTokenMutation, unknown, DeleteJobRunnerRegistrationTokenMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_JOB_RUNNER_REGISTRATION_TOKEN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunnerRegistrationTokens'] })
    },
  })
}

export const useJobRunnerRegistrationToken = (jobRunnerRegistrationTokenId?: JobRunnerRegistrationTokenQueryVariables['jobRunnerRegistrationTokenId']) => {
  const { client } = useGraphQLClient()
  return useQuery<JobRunnerRegistrationTokenQuery, unknown>({
    queryKey: ['jobRunnerRegistrationTokens', jobRunnerRegistrationTokenId],
    queryFn: async (): Promise<JobRunnerRegistrationTokenQuery> => {
      const result = await client.request(JOB_RUNNER_REGISTRATION_TOKEN, { jobRunnerRegistrationTokenId })
      return result as JobRunnerRegistrationTokenQuery
    },
    enabled: !!jobRunnerRegistrationTokenId,
  })
}

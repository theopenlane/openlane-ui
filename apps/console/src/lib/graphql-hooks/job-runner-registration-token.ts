import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  JobRunnerRegistrationToken,
  JobRunnerRegistrationTokenQuery,
  JobRunnerRegistrationTokenQueryVariables,
  JobRunnerRegistrationTokensWithFilterQuery,
  JobRunnerRegistrationTokensWithFilterQueryVariables,
  CreateJobRunnerRegistrationTokenMutation,
  CreateJobRunnerRegistrationTokenMutationVariables,
  CreateBulkCsvJobRunnerRegistrationTokenMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteJobRunnerRegistrationTokenMutation,
  DeleteJobRunnerRegistrationTokenMutationVariables,
  DeleteBulkJobRunnerRegistrationTokenMutation,
  DeleteBulkJobRunnerRegistrationTokenMutationVariables,
  UpdateJobRunnerRegistrationTokenMutation,
  UpdateJobRunnerRegistrationTokenMutationVariables,
  UpdateBulkJobRunnerRegistrationTokenMutation,
  UpdateBulkJobRunnerRegistrationTokenMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  JOB_RUNNER_REGISTRATION_TOKEN,
  GET_ALL_JOB_RUNNER_REGISTRATION_TOKENS,
  BULK_DELETE_JOB_RUNNER_REGISTRATION_TOKEN,
  CREATE_JOB_RUNNER_REGISTRATION_TOKEN,
  CREATE_CSV_BULK_JOB_RUNNER_REGISTRATION_TOKEN,
  DELETE_JOB_RUNNER_REGISTRATION_TOKEN,
  UPDATE_JOB_RUNNER_REGISTRATION_TOKEN,
  BULK_EDIT_JOB_RUNNER_REGISTRATION_TOKEN,
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

  const JobRunnerRegistrationTokens = (queryResult.data?.jobRunnerRegistrationTokens?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as JobRunnerRegistrationToken[]

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

export const useUpdateJobRunnerRegistrationToken = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateJobRunnerRegistrationTokenMutation, unknown, UpdateJobRunnerRegistrationTokenMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_JOB_RUNNER_REGISTRATION_TOKEN, variables),
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

export const useCreateBulkCSVJobRunnerRegistrationToken = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvJobRunnerRegistrationTokenMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_JOB_RUNNER_REGISTRATION_TOKEN, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunnerRegistrationTokens'] })
    },
  })
}

export const useBulkEditJobRunnerRegistrationToken = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkJobRunnerRegistrationTokenMutation, unknown, UpdateBulkJobRunnerRegistrationTokenMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_JOB_RUNNER_REGISTRATION_TOKEN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunnerRegistrationTokens'] })
    },
  })
}

export const useBulkDeleteJobRunnerRegistrationToken = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkJobRunnerRegistrationTokenMutation, unknown, DeleteBulkJobRunnerRegistrationTokenMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_JOB_RUNNER_REGISTRATION_TOKEN, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunnerRegistrationTokens'] })
    },
  })
}

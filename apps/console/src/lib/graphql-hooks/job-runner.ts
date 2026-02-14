import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  JobRunner,
  JobRunnerQuery,
  JobRunnerQueryVariables,
  JobRunnersWithFilterQuery,
  JobRunnersWithFilterQueryVariables,
  CreateJobRunnerMutation,
  CreateJobRunnerMutationVariables,
  CreateBulkCsvJobRunnerMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteJobRunnerMutation,
  DeleteJobRunnerMutationVariables,
  DeleteBulkJobRunnerMutation,
  DeleteBulkJobRunnerMutationVariables,
  UpdateJobRunnerMutation,
  UpdateJobRunnerMutationVariables,
  UpdateBulkJobRunnerMutation,
  UpdateBulkJobRunnerMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  JOB_RUNNER,
  GET_ALL_JOB_RUNNERS,
  BULK_DELETE_JOB_RUNNER,
  CREATE_JOB_RUNNER,
  CREATE_CSV_BULK_JOB_RUNNER,
  DELETE_JOB_RUNNER,
  UPDATE_JOB_RUNNER,
  BULK_EDIT_JOB_RUNNER,
} from '@repo/codegen/query/job-runner'

type GetAllJobRunnersArgs = {
  where?: JobRunnersWithFilterQueryVariables['where']
  orderBy?: JobRunnersWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useJobRunnersWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllJobRunnersArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<JobRunnersWithFilterQuery, unknown>({
    queryKey: ['jobRunners', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<JobRunnersWithFilterQuery> => {
      const result = await client.request(GET_ALL_JOB_RUNNERS, { where, orderBy, ...pagination?.query })
      return result as JobRunnersWithFilterQuery
    },
    enabled,
  })

  const JobRunners = (queryResult.data?.jobRunners?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as JobRunner[]

  return { ...queryResult, JobRunners }
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

export const useCreateBulkCSVJobRunner = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvJobRunnerMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_JOB_RUNNER, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunners'] })
    },
  })
}

export const useBulkEditJobRunner = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkJobRunnerMutation, unknown, UpdateBulkJobRunnerMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_JOB_RUNNER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunners'] })
    },
  })
}

export const useBulkDeleteJobRunner = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkJobRunnerMutation, unknown, DeleteBulkJobRunnerMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_JOB_RUNNER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRunners'] })
    },
  })
}

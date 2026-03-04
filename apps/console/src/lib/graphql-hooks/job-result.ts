import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type JobResultsWithFilterQuery,
  type JobResultsWithFilterQueryVariables,
  type CreateJobResultMutation,
  type CreateJobResultMutationVariables,
  type UpdateJobResultMutation,
  type UpdateJobResultMutationVariables,
  type DeleteJobResultMutation,
  type DeleteJobResultMutationVariables,
  type JobResultQuery,
  type JobResultQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_JOB_RESULTS, CREATE_JOB_RESULT, UPDATE_JOB_RESULT, DELETE_JOB_RESULT, JOB_RESULT } from '@repo/codegen/query/job-result'

type GetAllJobResultsArgs = {
  where?: JobResultsWithFilterQueryVariables['where']
  orderBy?: JobResultsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type JobResultsNode = NonNullable<NonNullable<NonNullable<JobResultsWithFilterQuery['jobResults']>['edges']>[number]>['node']

export type JobResultsNodeNonNull = NonNullable<JobResultsNode>

export const useJobResultsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllJobResultsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<JobResultsWithFilterQuery, unknown>({
    queryKey: ['jobResults', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<JobResultsWithFilterQuery> => {
      const result = await client.request<JobResultsWithFilterQuery>(GET_ALL_JOB_RESULTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.jobResults?.edges ?? []

  const jobResultsNodes: JobResultsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as JobResultsNodeNonNull)

  return { ...queryResult, jobResultsNodes }
}

export const useCreateJobResult = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateJobResultMutation, unknown, CreateJobResultMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_JOB_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobResults'] })
    },
  })
}

export const useUpdateJobResult = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateJobResultMutation, unknown, UpdateJobResultMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_JOB_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobResults'] })
    },
  })
}

export const useDeleteJobResult = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteJobResultMutation, unknown, DeleteJobResultMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_JOB_RESULT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobResults'] })
    },
  })
}

export const useJobResult = (jobResultId?: JobResultQueryVariables['jobResultId']) => {
  const { client } = useGraphQLClient()
  return useQuery<JobResultQuery, unknown>({
    queryKey: ['jobResults', jobResultId],
    queryFn: async (): Promise<JobResultQuery> => {
      const result = await client.request(JOB_RESULT, { jobResultId })
      return result as JobResultQuery
    },
    enabled: !!jobResultId,
  })
}

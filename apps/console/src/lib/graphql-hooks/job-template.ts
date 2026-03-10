import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type JobTemplatesWithFilterQuery,
  type JobTemplatesWithFilterQueryVariables,
  type CreateJobTemplateMutation,
  type CreateJobTemplateMutationVariables,
  type UpdateJobTemplateMutation,
  type UpdateJobTemplateMutationVariables,
  type DeleteJobTemplateMutation,
  type DeleteJobTemplateMutationVariables,
  type JobTemplateQuery,
  type JobTemplateQueryVariables,
  type CreateBulkCsvJobTemplateMutation,
  type CreateBulkCsvJobTemplateMutationVariables,
  type UpdateBulkJobTemplateMutation,
  type UpdateBulkJobTemplateMutationVariables,
  type DeleteBulkJobTemplateMutation,
  type DeleteBulkJobTemplateMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_JOB_TEMPLATES,
  CREATE_JOB_TEMPLATE,
  UPDATE_JOB_TEMPLATE,
  DELETE_JOB_TEMPLATE,
  JOB_TEMPLATE,
  CREATE_CSV_BULK_JOB_TEMPLATE,
  BULK_EDIT_JOB_TEMPLATE,
  BULK_DELETE_JOB_TEMPLATE,
} from '@repo/codegen/query/job-template'

type GetAllJobTemplatesArgs = {
  where?: JobTemplatesWithFilterQueryVariables['where']
  orderBy?: JobTemplatesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type JobTemplatesNode = NonNullable<NonNullable<NonNullable<JobTemplatesWithFilterQuery['jobTemplates']>['edges']>[number]>['node']

export type JobTemplatesNodeNonNull = NonNullable<JobTemplatesNode>

export const useJobTemplatesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllJobTemplatesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<JobTemplatesWithFilterQuery, unknown>({
    queryKey: ['jobTemplates', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<JobTemplatesWithFilterQuery> => {
      const result = await client.request<JobTemplatesWithFilterQuery>(GET_ALL_JOB_TEMPLATES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.jobTemplates?.edges ?? []

  const jobTemplatesNodes: JobTemplatesNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as JobTemplatesNodeNonNull)

  return { ...queryResult, jobTemplatesNodes }
}

export const useCreateJobTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateJobTemplateMutation, unknown, CreateJobTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_JOB_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] })
    },
  })
}

export const useUpdateJobTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateJobTemplateMutation, unknown, UpdateJobTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_JOB_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] })
    },
  })
}

export const useDeleteJobTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteJobTemplateMutation, unknown, DeleteJobTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_JOB_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] })
    },
  })
}

export const useJobTemplate = (jobTemplateId?: JobTemplateQueryVariables['jobTemplateId']) => {
  const { client } = useGraphQLClient()
  return useQuery<JobTemplateQuery, unknown>({
    queryKey: ['jobTemplates', jobTemplateId],
    queryFn: async (): Promise<JobTemplateQuery> => {
      const result = await client.request(JOB_TEMPLATE, { jobTemplateId })
      return result as JobTemplateQuery
    },
    enabled: !!jobTemplateId,
  })
}

export const useCreateBulkCSVJobTemplate = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvJobTemplateMutation, unknown, CreateBulkCsvJobTemplateMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_JOB_TEMPLATE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] })
    },
  })
}

export const useBulkEditJobTemplate = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkJobTemplateMutation, unknown, UpdateBulkJobTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_JOB_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] })
    },
  })
}

export const useBulkDeleteJobTemplate = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkJobTemplateMutation, unknown, DeleteBulkJobTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_JOB_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTemplates'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  EmailTemplate,
  EmailTemplateQuery,
  EmailTemplateQueryVariables,
  EmailTemplatesWithFilterQuery,
  EmailTemplatesWithFilterQueryVariables,
  CreateEmailTemplateMutation,
  CreateEmailTemplateMutationVariables,
  CreateBulkCsvEmailTemplateMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteEmailTemplateMutation,
  DeleteEmailTemplateMutationVariables,
  DeleteBulkEmailTemplateMutation,
  DeleteBulkEmailTemplateMutationVariables,
  UpdateEmailTemplateMutation,
  UpdateEmailTemplateMutationVariables,
  UpdateBulkEmailTemplateMutation,
  UpdateBulkEmailTemplateMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  EMAIL_TEMPLATE,
  GET_ALL_EMAIL_TEMPLATES,
  BULK_DELETE_EMAIL_TEMPLATE,
  CREATE_EMAIL_TEMPLATE,
  CREATE_CSV_BULK_EMAIL_TEMPLATE,
  DELETE_EMAIL_TEMPLATE,
  UPDATE_EMAIL_TEMPLATE,
  BULK_EDIT_EMAIL_TEMPLATE,
} from '@repo/codegen/query/email-template'

type GetAllEmailTemplatesArgs = {
  where?: EmailTemplatesWithFilterQueryVariables['where']
  orderBy?: EmailTemplatesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useEmailTemplatesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllEmailTemplatesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<EmailTemplatesWithFilterQuery, unknown>({
    queryKey: ['emailTemplates', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<EmailTemplatesWithFilterQuery> => {
      const result = await client.request(GET_ALL_EMAIL_TEMPLATES, { where, orderBy, ...pagination?.query })
      return result as EmailTemplatesWithFilterQuery
    },
    enabled,
  })

  const EmailTemplates = (queryResult.data?.emailTemplates?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as EmailTemplate[]

  return { ...queryResult, EmailTemplates }
}

export const useCreateEmailTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateEmailTemplateMutation, unknown, CreateEmailTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_EMAIL_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useUpdateEmailTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateEmailTemplateMutation, unknown, UpdateEmailTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_EMAIL_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useDeleteEmailTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteEmailTemplateMutation, unknown, DeleteEmailTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_EMAIL_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useEmailTemplate = (emailTemplateId?: EmailTemplateQueryVariables['emailTemplateId']) => {
  const { client } = useGraphQLClient()

  return useQuery<EmailTemplateQuery, unknown>({
    queryKey: ['emailTemplates', emailTemplateId],
    queryFn: async (): Promise<EmailTemplateQuery> => {
      const result = await client.request(EMAIL_TEMPLATE, { emailTemplateId })
      return result as EmailTemplateQuery
    },
    enabled: !!emailTemplateId,
  })
}

export const useCreateBulkCSVEmailTemplate = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvEmailTemplateMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_EMAIL_TEMPLATE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useBulkEditEmailTemplate = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkEmailTemplateMutation, unknown, UpdateBulkEmailTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_EMAIL_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

export const useBulkDeleteEmailTemplate = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkEmailTemplateMutation, unknown, DeleteBulkEmailTemplateMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_EMAIL_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
    },
  })
}

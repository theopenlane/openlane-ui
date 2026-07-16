import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'
import { useMemo } from 'react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type EmailTemplatesWithFilterQuery,
  type EmailTemplatesWithFilterQueryVariables,
  type EmailTemplateWhereInput,
  EmailTemplateTemplateContext,
  type CreateEmailTemplateMutation,
  type CreateEmailTemplateMutationVariables,
  type UpdateEmailTemplateMutation,
  type UpdateEmailTemplateMutationVariables,
  type DeleteEmailTemplateMutation,
  type DeleteEmailTemplateMutationVariables,
  type EmailTemplateQuery,
  type EmailTemplateQueryVariables,
  type Query,
  type QueryPreviewEmailTemplateArgs,
  type EmailTemplateCatalogEntry,
  type CreateBulkCsvEmailTemplateMutation,
  type CreateBulkCsvEmailTemplateMutationVariables,
  type UpdateBulkEmailTemplateMutation,
  type UpdateBulkEmailTemplateMutationVariables,
  type DeleteBulkEmailTemplateMutation,
  type DeleteBulkEmailTemplateMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_EMAIL_TEMPLATES,
  CREATE_EMAIL_TEMPLATE,
  UPDATE_EMAIL_TEMPLATE,
  DELETE_EMAIL_TEMPLATE,
  EMAIL_TEMPLATE,
  CREATE_CSV_BULK_EMAIL_TEMPLATE,
  BULK_EDIT_EMAIL_TEMPLATE,
  BULK_DELETE_EMAIL_TEMPLATE,
} from '@repo/codegen/query/email-template'
import { GET_EMAIL_TEMPLATE_CATALOG, PREVIEW_EMAIL_TEMPLATE } from '@repo/codegen/query/email-template-catalog'

type GetAllEmailTemplatesArgs = {
  where?: EmailTemplatesWithFilterQueryVariables['where']
  orderBy?: EmailTemplatesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type EmailTemplatesNode = NonNullable<NonNullable<NonNullable<EmailTemplatesWithFilterQuery['emailTemplates']>['edges']>[number]>['node']

export type EmailTemplatesNodeNonNull = NonNullable<EmailTemplatesNode>

export const useEmailTemplatesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllEmailTemplatesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<EmailTemplatesWithFilterQuery, unknown>({
    queryKey: ['emailTemplates', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<EmailTemplatesWithFilterQuery> => {
      const result = await client.request<EmailTemplatesWithFilterQuery>(GET_ALL_EMAIL_TEMPLATES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.emailTemplates?.edges ?? []

  const emailTemplatesNodes: EmailTemplatesNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as EmailTemplatesNodeNonNull)

  return { ...queryResult, emailTemplatesNodes }
}

const selectPagination: TPagination = { page: 1, pageSize: 100, query: { first: 100 } }

const campaignRecipientWhere: EmailTemplateWhereInput = { templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT, active: true }

export const useCampaignEmailTemplateSelect = ({ ensureId }: { ensureId?: string | null } = {}) => {
  const { emailTemplatesNodes, ...rest } = useEmailTemplatesWithFilter({ where: campaignRecipientWhere, pagination: selectPagination })
  const { data: ensured } = useEmailTemplate(emailTemplatesNodes.some((template) => template.id === ensureId) ? undefined : (ensureId ?? undefined))

  const emailTemplateOptions = useMemo(() => {
    const options = emailTemplatesNodes.map((template) => ({ label: template.name, value: template.id }))
    const ensuredTemplate = ensured?.emailTemplate
    if (ensuredTemplate && !options.some((option) => option.value === ensuredTemplate.id)) {
      options.push({ label: ensuredTemplate.name, value: ensuredTemplate.id })
    }
    return options
  }, [emailTemplatesNodes, ensured])

  return { ...rest, emailTemplateOptions }
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

type EmailTemplateCatalogQueryResult = Pick<Query, 'emailTemplateCatalog'>
type PreviewEmailTemplateResult = Pick<Query, 'previewEmailTemplate'>

export type EmailTemplateCatalogEntryNode = Omit<EmailTemplateCatalogEntry, 'configSchema' | 'uiSchema' | 'exampleValues'> & {
  configSchema: RJSFSchema
  uiSchema: UiSchema
  exampleValues?: Record<string, unknown> | null
}

export const useEmailTemplateCatalog = () => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<EmailTemplateCatalogQueryResult, unknown>({
    queryKey: ['emailTemplateCatalog'],
    queryFn: async (): Promise<EmailTemplateCatalogQueryResult> => {
      const result = await client.request<EmailTemplateCatalogQueryResult>(GET_EMAIL_TEMPLATE_CATALOG)
      return result
    },
    staleTime: Infinity,
  })

  const entries: EmailTemplateCatalogEntryNode[] = queryResult.data?.emailTemplateCatalog?.entries ?? []

  return { ...queryResult, entries }
}

type UsePreviewEmailTemplateArgs = {
  key?: string
  defaults: Record<string, unknown>
  enabled?: boolean
}

export const usePreviewEmailTemplate = ({ key, defaults, enabled = true }: UsePreviewEmailTemplateArgs) => {
  const { client } = useGraphQLClient()
  return useQuery<PreviewEmailTemplateResult, unknown>({
    queryKey: ['previewEmailTemplate', key, defaults],
    queryFn: async (): Promise<PreviewEmailTemplateResult> => {
      if (!key) throw new Error('previewEmailTemplate requires a template key')
      const variables: QueryPreviewEmailTemplateArgs = { key, defaults }
      return client.request<PreviewEmailTemplateResult>(PREVIEW_EMAIL_TEMPLATE, variables)
    },
    enabled: enabled && !!key,
    placeholderData: (previous) => previous,
  })
}

type UsePreviewEmailTemplateHtmlArgs = UsePreviewEmailTemplateArgs & { fallbackHtml?: string | null }

export const usePreviewEmailTemplateHtml = ({ fallbackHtml, ...args }: UsePreviewEmailTemplateHtmlArgs) => {
  const { data, isFetching, error } = usePreviewEmailTemplate(args)
  return {
    previewHtml: data?.previewEmailTemplate ?? fallbackHtml ?? '',
    isFetching,
    errorMessage: error ? parseErrorMessage(error) : null,
  }
}

export const useCreateBulkCSVEmailTemplate = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvEmailTemplateMutation, unknown, CreateBulkCsvEmailTemplateMutationVariables>({
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

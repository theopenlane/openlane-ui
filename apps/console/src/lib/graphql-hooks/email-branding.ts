import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  EmailBranding,
  EmailBrandingQuery,
  EmailBrandingQueryVariables,
  EmailBrandingsWithFilterQuery,
  EmailBrandingsWithFilterQueryVariables,
  CreateEmailBrandingMutation,
  CreateEmailBrandingMutationVariables,
  CreateBulkCsvEmailBrandingMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteEmailBrandingMutation,
  DeleteEmailBrandingMutationVariables,
  DeleteBulkEmailBrandingMutation,
  DeleteBulkEmailBrandingMutationVariables,
  UpdateEmailBrandingMutation,
  UpdateEmailBrandingMutationVariables,
  UpdateBulkEmailBrandingMutation,
  UpdateBulkEmailBrandingMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  EMAIL_BRANDING,
  GET_ALL_EMAIL_BRANDINGS,
  BULK_DELETE_EMAIL_BRANDING,
  CREATE_EMAIL_BRANDING,
  CREATE_CSV_BULK_EMAIL_BRANDING,
  DELETE_EMAIL_BRANDING,
  UPDATE_EMAIL_BRANDING,
  BULK_EDIT_EMAIL_BRANDING,
} from '@repo/codegen/query/email-branding'

type GetAllEmailBrandingsArgs = {
  where?: EmailBrandingsWithFilterQueryVariables['where']
  orderBy?: EmailBrandingsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useEmailBrandingsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllEmailBrandingsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<EmailBrandingsWithFilterQuery, unknown>({
    queryKey: ['emailBrandings', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<EmailBrandingsWithFilterQuery> => {
      const result = await client.request(GET_ALL_EMAIL_BRANDINGS, { where, orderBy, ...pagination?.query })
      return result as EmailBrandingsWithFilterQuery
    },
    enabled,
  })

  const EmailBrandings = (queryResult.data?.emailBrandings?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as EmailBranding[]

  return { ...queryResult, EmailBrandings }
}

export const useCreateEmailBranding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateEmailBrandingMutation, unknown, CreateEmailBrandingMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_EMAIL_BRANDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailBrandings'] })
    },
  })
}

export const useUpdateEmailBranding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateEmailBrandingMutation, unknown, UpdateEmailBrandingMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_EMAIL_BRANDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailBrandings'] })
    },
  })
}

export const useDeleteEmailBranding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteEmailBrandingMutation, unknown, DeleteEmailBrandingMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_EMAIL_BRANDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailBrandings'] })
    },
  })
}

export const useEmailBranding = (emailBrandingId?: EmailBrandingQueryVariables['emailBrandingId']) => {
  const { client } = useGraphQLClient()

  return useQuery<EmailBrandingQuery, unknown>({
    queryKey: ['emailBrandings', emailBrandingId],
    queryFn: async (): Promise<EmailBrandingQuery> => {
      const result = await client.request(EMAIL_BRANDING, { emailBrandingId })
      return result as EmailBrandingQuery
    },
    enabled: !!emailBrandingId,
  })
}

export const useCreateBulkCSVEmailBranding = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvEmailBrandingMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_EMAIL_BRANDING, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailBrandings'] })
    },
  })
}

export const useBulkEditEmailBranding = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkEmailBrandingMutation, unknown, UpdateBulkEmailBrandingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_EMAIL_BRANDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailBrandings'] })
    },
  })
}

export const useBulkDeleteEmailBranding = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkEmailBrandingMutation, unknown, DeleteBulkEmailBrandingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_EMAIL_BRANDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailBrandings'] })
    },
  })
}

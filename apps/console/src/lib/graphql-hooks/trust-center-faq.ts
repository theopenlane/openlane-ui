import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gql } from 'graphql-request'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type TrustCenterFaQsWithFilterQuery,
  type TrustCenterFaQsWithFilterQueryVariables,
  type CreateTrustCenterFaqMutation,
  type CreateTrustCenterFaqMutationVariables,
  type UpdateTrustCenterFaqMutation,
  type UpdateTrustCenterFaqMutationVariables,
  type UpdateTrustCenterFaqCommentMutation,
  type UpdateTrustCenterFaqCommentMutationVariables,
  type DeleteTrustCenterFaqMutation,
  type DeleteTrustCenterFaqMutationVariables,
  type TrustCenterFaqQuery,
  type TrustCenterFaqQueryVariables,
  type CreateBulkCsvTrustCenterFaqMutation,
  type CreateBulkCsvTrustCenterFaqMutationVariables,
  type UpdateBulkTrustCenterFaqMutation,
  type UpdateBulkTrustCenterFaqMutationVariables,
  type DeleteBulkTrustCenterFaqMutation,
  type DeleteBulkTrustCenterFaqMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_TRUST_CENTER_FAQS,
  CREATE_TRUST_CENTER_FAQ,
  UPDATE_TRUST_CENTER_FAQ,
  UPDATE_TRUST_CENTER_FAQ_COMMENT,
  DELETE_TRUST_CENTER_FAQ,
  TRUST_CENTER_FAQ,
  CREATE_CSV_BULK_TRUST_CENTER_FAQ,
  BULK_EDIT_TRUST_CENTER_FAQ,
  BULK_DELETE_TRUST_CENTER_FAQ,
} from '@repo/codegen/query/trust-center-faq'

type GetAllTrustCenterFaqsArgs = {
  where?: TrustCenterFaQsWithFilterQueryVariables['where']
  orderBy?: TrustCenterFaQsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type TrustCenterFaqsNode = NonNullable<NonNullable<NonNullable<TrustCenterFaQsWithFilterQuery['trustCenterFAQs']>['edges']>[number]>['node']

export type TrustCenterFaqsNodeNonNull = NonNullable<TrustCenterFaqsNode>

export const useTrustCenterFaqsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllTrustCenterFaqsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<TrustCenterFaQsWithFilterQuery, unknown>({
    queryKey: ['trustCenterFaqs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<TrustCenterFaQsWithFilterQuery> => {
      const result = await client.request<TrustCenterFaQsWithFilterQuery>(GET_ALL_TRUST_CENTER_FAQS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.trustCenterFAQs?.edges ?? []

  const trustCenterFaqsNodes: TrustCenterFaqsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as TrustCenterFaqsNodeNonNull)

  return { ...queryResult, trustCenterFaqsNodes }
}

export const useCreateTrustCenterFaq = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateTrustCenterFaqMutation, unknown, CreateTrustCenterFaqMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

export const useUpdateTrustCenterFaq = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateTrustCenterFaqMutation, unknown, UpdateTrustCenterFaqMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

export const useUpdateTrustCenterFaqComment = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateTrustCenterFaqCommentMutation, unknown, UpdateTrustCenterFaqCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TRUST_CENTER_FAQ_COMMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

export const useDeleteTrustCenterFaq = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteTrustCenterFaqMutation, unknown, DeleteTrustCenterFaqMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

export const useTrustCenterFaq = (trustCenterFAQId?: TrustCenterFaqQueryVariables['trustCenterFAQId']) => {
  const { client } = useGraphQLClient()
  return useQuery<TrustCenterFaqQuery, unknown>({
    queryKey: ['trustCenterFAQs', trustCenterFAQId],
    queryFn: async (): Promise<TrustCenterFaqQuery> => {
      const result = await client.request(TRUST_CENTER_FAQ, { trustCenterFAQId })
      return result as TrustCenterFaqQuery
    },
    enabled: !!trustCenterFAQId,
  })
}

export const useCreateBulkCSVTrustCenterFaq = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvTrustCenterFaqMutation, unknown, CreateBulkCsvTrustCenterFaqMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_TRUST_CENTER_FAQ, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

export const useBulkEditTrustCenterFaq = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkTrustCenterFaqMutation, unknown, UpdateBulkTrustCenterFaqMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

export const useBulkDeleteTrustCenterFaq = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkTrustCenterFaqMutation, unknown, DeleteBulkTrustCenterFaqMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

type ReorderItem = { id: string; displayOrder: number }

export const useReorderTrustCenterFaqs = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<Record<string, unknown>, unknown, ReorderItem[]>({
    mutationFn: async (items) => {
      if (items.length === 0) return {}

      const variableDefs = items.map((_, i) => `$id${i}: ID!, $input${i}: UpdateTrustCenterFAQInput!`).join(', ')
      const fields = items.map((_, i) => `update${i}: updateTrustCenterFAQ(id: $id${i}, input: $input${i}) { trustCenterFAQ { id } }`).join('\n  ')
      const document = gql`mutation ReorderFAQs(${variableDefs}) { ${fields} }`

      const variables: Record<string, unknown> = {}
      for (let i = 0; i < items.length; i++) {
        variables[`id${i}`] = items[i].id
        variables[`input${i}`] = { displayOrder: items[i].displayOrder }
      }

      return client.request(document, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFaqs'] })
    },
  })
}

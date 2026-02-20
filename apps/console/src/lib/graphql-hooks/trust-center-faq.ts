import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  TrustCenterFAQsWithFilterQuery,
  TrustCenterFAQsWithFilterQueryVariables,
  CreateTrustCenterFAQMutation,
  CreateTrustCenterFAQMutationVariables,
  UpdateTrustCenterFAQMutation,
  UpdateTrustCenterFAQMutationVariables,
  DeleteTrustCenterFAQMutation,
  DeleteTrustCenterFAQMutationVariables,
  TrustCenterFAQQuery,
  TrustCenterFAQQueryVariables,
  CreateBulkCsvTrustCenterFAQMutation,
  CreateBulkCsvTrustCenterFAQMutationVariables,
  UpdateBulkTrustCenterFAQMutation,
  UpdateBulkTrustCenterFAQMutationVariables,
  DeleteBulkTrustCenterFAQMutation,
  DeleteBulkTrustCenterFAQMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_TRUST_CENTER_FAQS,
  CREATE_TRUST_CENTER_FAQ,
  UPDATE_TRUST_CENTER_FAQ,
  DELETE_TRUST_CENTER_FAQ,
  TRUST_CENTER_FAQ,
  CREATE_CSV_BULK_TRUST_CENTER_FAQ,
  BULK_EDIT_TRUST_CENTER_FAQ,
  BULK_DELETE_TRUST_CENTER_FAQ,
} from '@repo/codegen/query/trust-center-faq'

type GetAllTrustCenterFAQsArgs = {
  where?: TrustCenterFAQsWithFilterQueryVariables['where']
  orderBy?: TrustCenterFAQsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type TrustCenterFAQsNode = NonNullable<NonNullable<NonNullable<TrustCenterFAQsWithFilterQuery['trustCenterFAQs']>['edges']>[number]>['node']

export type TrustCenterFAQsNodeNonNull = NonNullable<TrustCenterFAQsNode>

export const useTrustCenterFAQsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllTrustCenterFAQsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<TrustCenterFAQsWithFilterQuery, unknown>({
    queryKey: ['trustCenterFAQs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<TrustCenterFAQsWithFilterQuery> => {
      const result = await client.request<TrustCenterFAQsWithFilterQuery>(GET_ALL_TRUST_CENTER_FAQS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.trustCenterFAQs?.edges ?? []

  const trustCenterFAQsNodes: TrustCenterFAQsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as TrustCenterFAQsNodeNonNull)

  return { ...queryResult, trustCenterFAQsNodes }
}

export const useCreateTrustCenterFAQ = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateTrustCenterFAQMutation, unknown, CreateTrustCenterFAQMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFAQs'] })
    },
  })
}

export const useUpdateTrustCenterFAQ = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateTrustCenterFAQMutation, unknown, UpdateTrustCenterFAQMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFAQs'] })
    },
  })
}

export const useDeleteTrustCenterFAQ = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteTrustCenterFAQMutation, unknown, DeleteTrustCenterFAQMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFAQs'] })
    },
  })
}

export const useTrustCenterFAQ = (trustCenterFAQId?: TrustCenterFAQQueryVariables['trustCenterFAQId']) => {
  const { client } = useGraphQLClient()
  return useQuery<TrustCenterFAQQuery, unknown>({
    queryKey: ['trustCenterFAQs', trustCenterFAQId],
    queryFn: async (): Promise<TrustCenterFAQQuery> => {
      const result = await client.request(TRUST_CENTER_FAQ, { trustCenterFAQId })
      return result as TrustCenterFAQQuery
    },
    enabled: !!trustCenterFAQId,
  })
}

export const useCreateBulkCSVTrustCenterFAQ = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvTrustCenterFAQMutation, unknown, CreateBulkCsvTrustCenterFAQMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_TRUST_CENTER_FAQ, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFAQs'] })
    },
  })
}

export const useBulkEditTrustCenterFAQ = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkTrustCenterFAQMutation, unknown, UpdateBulkTrustCenterFAQMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFAQs'] })
    },
  })
}

export const useBulkDeleteTrustCenterFAQ = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkTrustCenterFAQMutation, unknown, DeleteBulkTrustCenterFAQMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_TRUST_CENTER_FAQ, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterFAQs'] })
    },
  })
}

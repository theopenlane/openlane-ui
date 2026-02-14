import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CreateTrustCenterDocMutation,
  CreateTrustCenterDocMutationVariables,
  DeleteTrustCenterDocMutation,
  DeleteTrustCenterDocMutationVariables,
  BulkDeleteTrustCenterDocMutation,
  BulkDeleteTrustCenterDocMutationVariables,
  BulkUpdateTrustCenterDocMutation,
  BulkUpdateTrustCenterDocMutationVariables,
  GetTruestCenterDocByIdQuery,
  GetTruestCenterDocByIdQueryVariables,
  GetTrustCenterDocsQuery,
  GetTrustCenterDocsQueryVariables,
  UpdateTrustCenterDocMutation,
  UpdateTrustCenterDocMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  UPDATE_TRUST_CENTER_DOC,
  GET_ALL_TRUST_CENTER_DOCS,
  GET_ALL_TRUST_CENTER_DOC_BY_ID,
  DELETE_TRUST_CENTER_DOC,
  CREATE_TRUST_CENTER_DOC,
  BULK_DELETE_TRUST_CENTER_DOC,
  BULK_UPDATE_TRUST_CENTER_DOC,
} from '@repo/codegen/query/trust-center-doc'

type UseGetTrustCenterDocsArgs = {
  where?: GetTrustCenterDocsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetTrustCenterDocsQueryVariables['orderBy']
  enabled?: boolean
}

export const useGetTrustCenterDocs = ({ where, pagination, orderBy, enabled = true }: UseGetTrustCenterDocsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterDocsQuery>({
    queryKey: ['trustCenter', 'docs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetTrustCenterDocsQuery, GetTrustCenterDocsQueryVariables>(GET_ALL_TRUST_CENTER_DOCS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.trustCenters?.edges?.[0]?.node?.trustCenterDocs?.edges ?? []
  const docs = edges.map((edge) => edge?.node)
  const paginationMeta = {
    totalCount: queryResult.data?.trustCenters?.edges?.[0]?.node?.trustCenterDocs?.totalCount ?? 0,
    pageInfo: queryResult.data?.trustCenters?.edges?.[0]?.node?.trustCenterDocs?.pageInfo ?? {},
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    docs,
    paginationMeta,
  }
}

export const useCreateTrustCenterDoc = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateTrustCenterDocMutation, unknown, CreateTrustCenterDocMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: CREATE_TRUST_CENTER_DOC,
        variables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

export const useUpdateTrustCenterDoc = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterDocMutation, unknown, UpdateTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => {
      const { input, updateTrustCenterDocId, trustCenterDocFile } = variables as UpdateTrustCenterDocMutationVariables & {
        trustCenterDocFile?: File
      }
      if (trustCenterDocFile) {
        return fetchGraphQLWithUpload({
          query: UPDATE_TRUST_CENTER_DOC,
          variables: {
            input,
            updateTrustCenterDocId,
            trustCenterDocFile,
          },
        })
      }
      return client.request<UpdateTrustCenterDocMutation, UpdateTrustCenterDocMutationVariables>(UPDATE_TRUST_CENTER_DOC, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

type UseGetTrustCenterDocByIdArgs = {
  trustCenterDocId: string
  enabled?: boolean
}

export const useGetTrustCenterDocById = ({ trustCenterDocId, enabled = true }: UseGetTrustCenterDocByIdArgs) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTruestCenterDocByIdQuery>({
    queryKey: ['trustCenter', 'docs', trustCenterDocId],

    queryFn: async () =>
      client.request<GetTruestCenterDocByIdQuery, GetTruestCenterDocByIdQueryVariables>(GET_ALL_TRUST_CENTER_DOC_BY_ID, {
        trustCenterDocId,
      }),
    enabled: !!trustCenterDocId && enabled,
  })
}

export const useDeleteTrustCenterDoc = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteTrustCenterDocMutation, unknown, DeleteTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteTrustCenterDocMutation, DeleteTrustCenterDocMutationVariables>(DELETE_TRUST_CENTER_DOC, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

export const useBulkDeleteTrustCenterDocs = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<BulkDeleteTrustCenterDocMutation, unknown, BulkDeleteTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => {
      return await client.request<BulkDeleteTrustCenterDocMutation, BulkDeleteTrustCenterDocMutationVariables>(BULK_DELETE_TRUST_CENTER_DOC, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

export const useBulkUpdateTrustCenterDocs = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<BulkUpdateTrustCenterDocMutation, unknown, BulkUpdateTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_UPDATE_TRUST_CENTER_DOC, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'docs'] })
    },
  })
}

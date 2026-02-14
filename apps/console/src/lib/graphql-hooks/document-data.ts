import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  DocumentData,
  DocumentDataQuery,
  DocumentDataQueryVariables,
  DocumentDataWithFilterQuery,
  DocumentDataWithFilterQueryVariables,
  CreateDocumentDataMutation,
  CreateDocumentDataMutationVariables,
  CreateBulkCsvDocumentDataMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteDocumentDataMutation,
  DeleteDocumentDataMutationVariables,
  DeleteBulkDocumentDataMutation,
  DeleteBulkDocumentDataMutationVariables,
  UpdateDocumentDataMutation,
  UpdateDocumentDataMutationVariables,
  UpdateBulkDocumentDataMutation,
  UpdateBulkDocumentDataMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  DOCUMENT_DATA,
  GET_ALL_DOCUMENT_DATA,
  BULK_DELETE_DOCUMENT_DATA,
  CREATE_DOCUMENT_DATA,
  CREATE_CSV_BULK_DOCUMENT_DATA,
  DELETE_DOCUMENT_DATA,
  UPDATE_DOCUMENT_DATA,
  BULK_EDIT_DOCUMENT_DATA,
} from '@repo/codegen/query/document-data'

type GetAllDocumentDataArgs = {
  where?: DocumentDataWithFilterQueryVariables['where']
  orderBy?: DocumentDataWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useDocumentDataWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllDocumentDataArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<DocumentDataWithFilterQuery, unknown>({
    queryKey: ['documentData', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<DocumentDataWithFilterQuery> => {
      const result = await client.request(GET_ALL_DOCUMENT_DATA, { where, orderBy, ...pagination?.query })
      return result as DocumentDataWithFilterQuery
    },
    enabled,
  })

  const DocumentData = (queryResult.data?.documentData?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as DocumentData[]

  return { ...queryResult, DocumentData }
}

export const useCreateDocumentData = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateDocumentDataMutation, unknown, CreateDocumentDataMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_DOCUMENT_DATA, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentData'] })
    },
  })
}

export const useUpdateDocumentData = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateDocumentDataMutation, unknown, UpdateDocumentDataMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_DOCUMENT_DATA, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentData'] })
    },
  })
}

export const useDeleteDocumentData = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteDocumentDataMutation, unknown, DeleteDocumentDataMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_DOCUMENT_DATA, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentData'] })
    },
  })
}

export const useDocumentData = (documentDataId?: DocumentDataQueryVariables['documentDataId']) => {
  const { client } = useGraphQLClient()

  return useQuery<DocumentDataQuery, unknown>({
    queryKey: ['documentData', documentDataId],
    queryFn: async (): Promise<DocumentDataQuery> => {
      const result = await client.request(DOCUMENT_DATA, { documentDataId })
      return result as DocumentDataQuery
    },
    enabled: !!documentDataId,
  })
}

export const useCreateBulkCSVDocumentData = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvDocumentDataMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_DOCUMENT_DATA, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentData'] })
    },
  })
}

export const useBulkEditDocumentData = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkDocumentDataMutation, unknown, UpdateBulkDocumentDataMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_DOCUMENT_DATA, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentData'] })
    },
  })
}

export const useBulkDeleteDocumentData = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkDocumentDataMutation, unknown, DeleteBulkDocumentDataMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_DOCUMENT_DATA, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentData'] })
    },
  })
}

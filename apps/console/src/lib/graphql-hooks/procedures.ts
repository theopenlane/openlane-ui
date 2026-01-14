import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_PROCEDURE,
  UPDATE_PROCEDURE,
  GET_ALL_PROCEDURES_WITH_DETAILS,
  GET_PROCEDURE_DETAILS_BY_ID,
  DELETE_PROCEDURE,
  CREATE_CSV_BULK_PROCEDURE,
  GET_TABLE_PROCEDURES,
  BULK_EDIT_PROCEDURE,
  CREATE_UPLOAD_PROCEDURE,
  BULK_DELETE_PROCEDURE,
  GET_PROCEDURE_ASSOCIATIONS_BY_ID,
  INSERT_PROCEDURE_COMMENT,
  GET_PROCEDURE_DISCUSSION_BY_ID,
  UPDATE_PROCEDURE_COMMENT,
} from '@repo/codegen/query/procedure'

import {
  CreateProcedureMutation,
  CreateProcedureMutationVariables,
  UpdateProcedureMutation,
  UpdateProcedureMutationVariables,
  GetAllProceduresWithDetailsQuery,
  GetProcedureDetailsByIdQuery,
  GetProcedureDetailsByIdQueryVariables,
  DeleteProcedureMutation,
  DeleteProcedureMutationVariables,
  Procedure,
  CreateBulkCsvProcedureMutation,
  CreateBulkCsvProcedureMutationVariables,
  GetProceduresListQueryVariables,
  GetProceduresTableListQuery,
  UpdateBulkProcedureMutation,
  UpdateBulkProcedureMutationVariables,
  CreateUploadProcedureMutation,
  CreateUploadProcedureMutationVariables,
  DeleteBulkProcedureMutation,
  DeleteBulkProcedureMutationVariables,
  GetProcedureAssociationsByIdQuery,
  GetProcedureAssociationsByIdQueryVariables,
  InsertProcedureCommentMutation,
  InsertProcedureCommentMutationVariables,
  GetProcedureDiscussionByIdQuery,
  UpdateProcedureCommentMutation,
  UpdateProcedureCommentMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

export const useGetAllProceduresWithDetails = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllProceduresWithDetailsQuery>({
    queryKey: ['procedures', 'withDetails'],
    queryFn: () => client.request(GET_ALL_PROCEDURES_WITH_DETAILS),
  })
}

type UseProceduresArgs = {
  where?: GetProceduresListQueryVariables['where']
  orderBy?: GetProceduresListQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useProcedures = ({ where, orderBy, pagination, enabled = true }: UseProceduresArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetProceduresTableListQuery>({
    queryKey: ['procedures', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async () =>
      client.request(GET_TABLE_PROCEDURES, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const procedures = (queryResult.data?.procedures?.edges ?? []).map((edge) => edge?.node) as Procedure[]

  const paginationMeta = {
    totalCount: queryResult.data?.procedures?.totalCount ?? 0,
    pageInfo: queryResult.data?.procedures?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    procedures,
    paginationMeta,
    isLoading: queryResult.isFetching,
  }
}

export const useProcedureSelect = () => {
  const { data, ...rest } = useProcedures({
    where: {},
    enabled: true,
  })

  const procedureOptions = data?.procedures?.edges?.flatMap((edge) => (edge?.node?.id && edge?.node?.name ? [{ label: edge.node.name, value: edge.node.id }] : [])) ?? []

  return { procedureOptions, ...rest }
}

export const useGetProcedureDetailsById = (procedureId: string | null, enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProcedureDetailsByIdQuery, GetProcedureDetailsByIdQueryVariables>({
    queryKey: ['procedures', procedureId],
    queryFn: () => client.request(GET_PROCEDURE_DETAILS_BY_ID, { procedureId }),
    enabled: !!procedureId && enabled,
  })
}

export const useGetProcedureAssociationsById = (procedureId: string | null, enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProcedureAssociationsByIdQuery, unknown>({
    queryKey: ['procedures', procedureId, 'associations'],
    queryFn: async () =>
      client.request<GetProcedureAssociationsByIdQuery, GetProcedureAssociationsByIdQueryVariables>(GET_PROCEDURE_ASSOCIATIONS_BY_ID, {
        procedureId: procedureId as string,
      }),
    enabled: !!procedureId && enabled,
  })
}

export const useCreateProcedure = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateProcedureMutation, unknown, CreateProcedureMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_PROCEDURE, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  })
}

export const useUpdateProcedure = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateProcedureMutation, unknown, UpdateProcedureMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_PROCEDURE, variables),
  })
}

export const useBulkEditProcedure = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateBulkProcedureMutation, unknown, UpdateBulkProcedureMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_PROCEDURE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })
}

export const useDeleteProcedure = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteProcedureMutation, unknown, DeleteProcedureMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_PROCEDURE, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedures'] }),
  })
}

export const useCreateBulkCSVProcedure = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvProcedureMutation, unknown, CreateBulkCsvProcedureMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_PROCEDURE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })
}

export const useCreateUploadProcedure = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateUploadProcedureMutation, unknown, CreateUploadProcedureMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_UPLOAD_PROCEDURE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })
}

export const useBulkDeleteProcedures = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkProcedureMutation, unknown, DeleteBulkProcedureMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_PROCEDURE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
    },
  })
}

export const PROCEDURE_DISCUSSION_QUERY_KEY = 'procedureDiscussion'

export const useGetProcedureDiscussionById = (procedureId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetProcedureDiscussionByIdQuery, unknown>({
    queryKey: [PROCEDURE_DISCUSSION_QUERY_KEY, procedureId],
    queryFn: async () => client.request(GET_PROCEDURE_DISCUSSION_BY_ID, { procedureId }),
    enabled: !!procedureId,
  })
}

export const useInsertProcedureComment = () => {
  const { client } = useGraphQLClient()

  return useMutation<InsertProcedureCommentMutation, unknown, InsertProcedureCommentMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(INSERT_PROCEDURE_COMMENT, variables)
    },
  })
}

export const useUpdateProcedureComment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateProcedureCommentMutation, unknown, UpdateProcedureCommentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_PROCEDURE_COMMENT, variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['procedureComments', data.updateProcedureComment.procedure.id] })
    },
  })
}

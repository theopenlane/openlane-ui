import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Finding,
  FindingQuery,
  FindingQueryVariables,
  FindingsWithFilterQuery,
  FindingsWithFilterQueryVariables,
  CreateFindingMutation,
  CreateFindingMutationVariables,
  CreateBulkCsvFindingMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteFindingMutation,
  DeleteFindingMutationVariables,
  DeleteBulkFindingMutation,
  DeleteBulkFindingMutationVariables,
  UpdateFindingMutation,
  UpdateFindingMutationVariables,
  UpdateBulkFindingMutation,
  UpdateBulkFindingMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { FINDING, GET_ALL_FINDINGS, BULK_DELETE_FINDING, CREATE_FINDING, CREATE_CSV_BULK_FINDING, DELETE_FINDING, UPDATE_FINDING, BULK_EDIT_FINDING } from '@repo/codegen/query/finding'

type GetAllFindingsArgs = {
  where?: FindingsWithFilterQueryVariables['where']
  orderBy?: FindingsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useFindingsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllFindingsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<FindingsWithFilterQuery, unknown>({
    queryKey: ['findings', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<FindingsWithFilterQuery> => {
      const result = await client.request(GET_ALL_FINDINGS, { where, orderBy, ...pagination?.query })
      return result as FindingsWithFilterQuery
    },
    enabled,
  })

  const Findings = (queryResult.data?.findings?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Finding[]

  return { ...queryResult, Findings }
}

export const useCreateFinding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateFindingMutation, unknown, CreateFindingMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_FINDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] })
    },
  })
}

export const useUpdateFinding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateFindingMutation, unknown, UpdateFindingMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_FINDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] })
    },
  })
}

export const useDeleteFinding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteFindingMutation, unknown, DeleteFindingMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_FINDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] })
    },
  })
}

export const useFinding = (findingId?: FindingQueryVariables['findingId']) => {
  const { client } = useGraphQLClient()

  return useQuery<FindingQuery, unknown>({
    queryKey: ['findings', findingId],
    queryFn: async (): Promise<FindingQuery> => {
      const result = await client.request(FINDING, { findingId })
      return result as FindingQuery
    },
    enabled: !!findingId,
  })
}

export const useCreateBulkCSVFinding = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvFindingMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_FINDING, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] })
    },
  })
}

export const useBulkEditFinding = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkFindingMutation, unknown, UpdateBulkFindingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_FINDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] })
    },
  })
}

export const useBulkDeleteFinding = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkFindingMutation, unknown, DeleteBulkFindingMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_FINDING, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] })
    },
  })
}

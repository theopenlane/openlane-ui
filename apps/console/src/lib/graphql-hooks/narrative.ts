import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Narrative,
  NarrativeQuery,
  NarrativeQueryVariables,
  NarrativesWithFilterQuery,
  NarrativesWithFilterQueryVariables,
  CreateNarrativeMutation,
  CreateNarrativeMutationVariables,
  CreateBulkCsvNarrativeMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteNarrativeMutation,
  DeleteNarrativeMutationVariables,
  DeleteBulkNarrativeMutation,
  DeleteBulkNarrativeMutationVariables,
  UpdateNarrativeMutation,
  UpdateNarrativeMutationVariables,
  UpdateBulkNarrativeMutation,
  UpdateBulkNarrativeMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  NARRATIVE,
  GET_ALL_NARRATIVES,
  BULK_DELETE_NARRATIVE,
  CREATE_NARRATIVE,
  CREATE_CSV_BULK_NARRATIVE,
  DELETE_NARRATIVE,
  UPDATE_NARRATIVE,
  BULK_EDIT_NARRATIVE,
} from '@repo/codegen/query/narrative'

type GetAllNarrativesArgs = {
  where?: NarrativesWithFilterQueryVariables['where']
  orderBy?: NarrativesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useNarrativesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllNarrativesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<NarrativesWithFilterQuery, unknown>({
    queryKey: ['narratives', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<NarrativesWithFilterQuery> => {
      const result = await client.request(GET_ALL_NARRATIVES, { where, orderBy, ...pagination?.query })
      return result as NarrativesWithFilterQuery
    },
    enabled,
  })

  const Narratives = (queryResult.data?.narratives?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Narrative[]

  return { ...queryResult, Narratives }
}

export const useCreateNarrative = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateNarrativeMutation, unknown, CreateNarrativeMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_NARRATIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narratives'] })
    },
  })
}

export const useUpdateNarrative = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateNarrativeMutation, unknown, UpdateNarrativeMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_NARRATIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narratives'] })
    },
  })
}

export const useDeleteNarrative = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteNarrativeMutation, unknown, DeleteNarrativeMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_NARRATIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narratives'] })
    },
  })
}

export const useNarrative = (narrativeId?: NarrativeQueryVariables['narrativeId']) => {
  const { client } = useGraphQLClient()

  return useQuery<NarrativeQuery, unknown>({
    queryKey: ['narratives', narrativeId],
    queryFn: async (): Promise<NarrativeQuery> => {
      const result = await client.request(NARRATIVE, { narrativeId })
      return result as NarrativeQuery
    },
    enabled: !!narrativeId,
  })
}

export const useCreateBulkCSVNarrative = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvNarrativeMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_NARRATIVE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narratives'] })
    },
  })
}

export const useBulkEditNarrative = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkNarrativeMutation, unknown, UpdateBulkNarrativeMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_NARRATIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narratives'] })
    },
  })
}

export const useBulkDeleteNarrative = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkNarrativeMutation, unknown, DeleteBulkNarrativeMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_NARRATIVE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['narratives'] })
    },
  })
}

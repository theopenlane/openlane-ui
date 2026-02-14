import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  FindingControl,
  FindingControlQuery,
  FindingControlQueryVariables,
  FindingControlsWithFilterQuery,
  FindingControlsWithFilterQueryVariables,
  CreateFindingControlMutation,
  CreateFindingControlMutationVariables,
  CreateBulkCsvFindingControlMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteFindingControlMutation,
  DeleteFindingControlMutationVariables,
  DeleteBulkFindingControlMutation,
  DeleteBulkFindingControlMutationVariables,
  UpdateFindingControlMutation,
  UpdateFindingControlMutationVariables,
  UpdateBulkFindingControlMutation,
  UpdateBulkFindingControlMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  FINDING_CONTROL,
  GET_ALL_FINDING_CONTROLS,
  BULK_DELETE_FINDING_CONTROL,
  CREATE_FINDING_CONTROL,
  CREATE_CSV_BULK_FINDING_CONTROL,
  DELETE_FINDING_CONTROL,
  UPDATE_FINDING_CONTROL,
  BULK_EDIT_FINDING_CONTROL,
} from '@repo/codegen/query/finding-control'

type GetAllFindingControlsArgs = {
  where?: FindingControlsWithFilterQueryVariables['where']
  orderBy?: FindingControlsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useFindingControlsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllFindingControlsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<FindingControlsWithFilterQuery, unknown>({
    queryKey: ['findingControls', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<FindingControlsWithFilterQuery> => {
      const result = await client.request(GET_ALL_FINDING_CONTROLS, { where, orderBy, ...pagination?.query })
      return result as FindingControlsWithFilterQuery
    },
    enabled,
  })

  const FindingControls = (queryResult.data?.findingControls?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as FindingControl[]

  return { ...queryResult, FindingControls }
}

export const useCreateFindingControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateFindingControlMutation, unknown, CreateFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_FINDING_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findingControls'] })
    },
  })
}

export const useUpdateFindingControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateFindingControlMutation, unknown, UpdateFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_FINDING_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findingControls'] })
    },
  })
}

export const useDeleteFindingControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteFindingControlMutation, unknown, DeleteFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_FINDING_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findingControls'] })
    },
  })
}

export const useFindingControl = (findingControlId?: FindingControlQueryVariables['findingControlId']) => {
  const { client } = useGraphQLClient()

  return useQuery<FindingControlQuery, unknown>({
    queryKey: ['findingControls', findingControlId],
    queryFn: async (): Promise<FindingControlQuery> => {
      const result = await client.request(FINDING_CONTROL, { findingControlId })
      return result as FindingControlQuery
    },
    enabled: !!findingControlId,
  })
}

export const useCreateBulkCSVFindingControl = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvFindingControlMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_FINDING_CONTROL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findingControls'] })
    },
  })
}

export const useBulkEditFindingControl = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkFindingControlMutation, unknown, UpdateBulkFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_FINDING_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findingControls'] })
    },
  })
}

export const useBulkDeleteFindingControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkFindingControlMutation, unknown, DeleteBulkFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_FINDING_CONTROL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findingControls'] })
    },
  })
}

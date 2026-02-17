import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  FindingControlsWithFilterQuery,
  FindingControlsWithFilterQueryVariables,
  CreateFindingControlMutation,
  CreateFindingControlMutationVariables,
  UpdateFindingControlMutation,
  UpdateFindingControlMutationVariables,
  DeleteFindingControlMutation,
  DeleteFindingControlMutationVariables,
  FindingControlQuery,
  FindingControlQueryVariables,
  CreateBulkCsvFindingControlMutation,
  CreateBulkCsvTaskMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_FINDING_CONTROLS, CREATE_FINDING_CONTROL, UPDATE_FINDING_CONTROL, DELETE_FINDING_CONTROL, FINDING_CONTROL, CREATE_CSV_BULK_FINDING_CONTROL } from '@repo/codegen/query/finding-control'

type GetAllFindingControlsArgs = {
  where?: FindingControlsWithFilterQueryVariables['where']
  orderBy?: FindingControlsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type FindingControlsNode = NonNullable<NonNullable<NonNullable<FindingControlsWithFilterQuery['findingControls']>['edges']>[number]>['node']

export type FindingControlsNodeNonNull = NonNullable<FindingControlsNode>

export const useFindingControlsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllFindingControlsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<FindingControlsWithFilterQuery, unknown>({
    queryKey: ['findingControls', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<FindingControlsWithFilterQuery> => {
      const result = await client.request<FindingControlsWithFilterQuery>(GET_ALL_FINDING_CONTROLS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.findingControls?.edges ?? []

  const findingControlsNodes: FindingControlsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as FindingControlsNodeNonNull)

  return { ...queryResult, findingControlsNodes }
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

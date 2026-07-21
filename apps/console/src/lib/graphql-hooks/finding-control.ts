import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { invalidateControlQueries } from '@/lib/graphql-hooks/control'
import {
  type FindingControlsWithFilterQuery,
  type FindingControlsWithFilterQueryVariables,
  type CreateFindingControlMutation,
  type CreateFindingControlMutationVariables,
  type CreateBulkFindingControlMutation,
  type CreateBulkFindingControlMutationVariables,
  type UpdateFindingControlMutation,
  type UpdateFindingControlMutationVariables,
  type DeleteBulkFindingControlMutation,
  type DeleteBulkFindingControlMutationVariables,
  type FindingControlQuery,
  type FindingControlQueryVariables,
  type CreateBulkCsvFindingControlMutation,
  type CreateBulkCsvFindingControlMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_FINDING_CONTROLS,
  CREATE_FINDING_CONTROL,
  CREATE_BULK_FINDING_CONTROL,
  UPDATE_FINDING_CONTROL,
  BULK_DELETE_FINDING_CONTROL,
  FINDING_CONTROL,
  CREATE_CSV_BULK_FINDING_CONTROL,
} from '@repo/codegen/query/finding-control'

export const invalidateFindingControlQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['findingControls'] })
  queryClient.invalidateQueries({ queryKey: ['findings'] })
  invalidateControlQueries(queryClient)
}

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
      invalidateFindingControlQueries(queryClient)
    },
  })
}

export const useCreateBulkFindingControl = () => {
  const { client } = useGraphQLClient()
  return useMutation<CreateBulkFindingControlMutation, unknown, CreateBulkFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_BULK_FINDING_CONTROL, variables),
  })
}

export const useBulkDeleteFindingControl = () => {
  const { client } = useGraphQLClient()
  return useMutation<DeleteBulkFindingControlMutation, unknown, DeleteBulkFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_FINDING_CONTROL, variables),
  })
}

export const useUpdateFindingControl = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateFindingControlMutation, unknown, UpdateFindingControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_FINDING_CONTROL, variables),
    onSuccess: () => {
      invalidateFindingControlQueries(queryClient)
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
  return useMutation<CreateBulkCsvFindingControlMutation, unknown, CreateBulkCsvFindingControlMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_FINDING_CONTROL, variables }),
    onSuccess: () => {
      invalidateFindingControlQueries(queryClient)
    },
  })
}

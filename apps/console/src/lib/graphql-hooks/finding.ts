import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type FindingsWithFilterQuery,
  type FindingsWithFilterQueryVariables,
  type FindingBulkCreatePayload,
  type CreateFindingInput,
  type CreateFindingMutation,
  type CreateFindingMutationVariables,
  type UpdateFindingMutation,
  type UpdateFindingMutationVariables,
  type DeleteFindingMutation,
  type DeleteFindingMutationVariables,
  type FindingQuery,
  type FindingQueryVariables,
  type CreateBulkCsvFindingMutation,
  type CreateBulkCsvFindingMutationVariables,
  type UpdateBulkFindingMutation,
  type UpdateBulkFindingMutationVariables,
  type DeleteBulkFindingMutation,
  type DeleteBulkFindingMutationVariables,
  type GetFindingAssociationsQuery,
  FindingSecurityLevel,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_FINDINGS,
  CREATE_FINDING,
  CREATE_BULK_FINDING,
  UPDATE_FINDING,
  DELETE_FINDING,
  FINDING,
  CREATE_CSV_BULK_FINDING,
  BULK_EDIT_FINDING,
  BULK_DELETE_FINDING,
  GET_FINDING_ASSOCIATIONS,
} from '@repo/codegen/query/finding'

type GetAllFindingsArgs = {
  where?: FindingsWithFilterQueryVariables['where']
  orderBy?: FindingsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type FindingsNode = NonNullable<NonNullable<NonNullable<FindingsWithFilterQuery['findings']>['edges']>[number]>['node']

export type FindingsNodeNonNull = NonNullable<FindingsNode>

export const useFindingsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllFindingsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<FindingsWithFilterQuery, unknown>({
    queryKey: ['findings', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<FindingsWithFilterQuery> => {
      const result = await client.request<FindingsWithFilterQuery>(GET_ALL_FINDINGS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.findings?.edges ?? []

  const findingsNodes: FindingsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as FindingsNodeNonNull)

  return { ...queryResult, findingsNodes }
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

type CreateBulkFindingMutation = {
  createBulkFinding: FindingBulkCreatePayload
}

type CreateBulkFindingMutationVariables = {
  input?: CreateFindingInput[]
}

export const useCreateBulkFinding = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateBulkFindingMutation, unknown, CreateBulkFindingMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_BULK_FINDING, variables),
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

export const useCreateBulkCSVFinding = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvFindingMutation, unknown, CreateBulkCsvFindingMutationVariables>({
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

export const useGetFindingAssociations = (findingId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<GetFindingAssociationsQuery, unknown>({
    queryKey: ['findings', findingId, 'associations'],
    queryFn: async () => client.request<GetFindingAssociationsQuery>(GET_FINDING_ASSOCIATIONS, { findingId: findingId as string }),
    enabled: !!findingId,
  })
}

export const useFindingSeverityCounts = (enabled: boolean = true) => {
  const { client } = useGraphQLClient()

  const critical = useQuery<FindingsWithFilterQuery, unknown>({
    queryKey: ['findings', 'severity-count', 'critical'],
    queryFn: async () => client.request<FindingsWithFilterQuery>(GET_ALL_FINDINGS, { where: { securityLevelIn: [FindingSecurityLevel.CRITICAL], open: true }, first: 1 }),
    enabled,
  })

  const high = useQuery<FindingsWithFilterQuery, unknown>({
    queryKey: ['findings', 'severity-count', 'high'],
    queryFn: async () => client.request<FindingsWithFilterQuery>(GET_ALL_FINDINGS, { where: { securityLevelIn: [FindingSecurityLevel.HIGH], open: true }, first: 1 }),
    enabled,
  })

  const medium = useQuery<FindingsWithFilterQuery, unknown>({
    queryKey: ['findings', 'severity-count', 'medium'],
    queryFn: async () => client.request<FindingsWithFilterQuery>(GET_ALL_FINDINGS, { where: { securityLevelIn: [FindingSecurityLevel.MEDIUM], open: true }, first: 1 }),
    enabled,
  })

  const low = useQuery<FindingsWithFilterQuery, unknown>({
    queryKey: ['findings', 'severity-count', 'low'],
    queryFn: async () => client.request<FindingsWithFilterQuery>(GET_ALL_FINDINGS, { where: { securityLevelIn: [FindingSecurityLevel.LOW], open: true }, first: 1 }),
    enabled,
  })

  return {
    critical: critical.data?.findings?.totalCount ?? 0,
    high: high.data?.findings?.totalCount ?? 0,
    medium: medium.data?.findings?.totalCount ?? 0,
    low: low.data?.findings?.totalCount ?? 0,
    isLoading: critical.isLoading || high.isLoading || medium.isLoading || low.isLoading,
  }
}

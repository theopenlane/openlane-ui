import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  RemediationsWithFilterQuery,
  RemediationsWithFilterQueryVariables,
  CreateRemediationMutation,
  CreateRemediationMutationVariables,
  UpdateRemediationMutation,
  UpdateRemediationMutationVariables,
  DeleteRemediationMutation,
  DeleteRemediationMutationVariables,
  RemediationQuery,
  RemediationQueryVariables,
  CreateBulkCsvRemediationMutation,
  CreateBulkCsvRemediationMutationVariables,
  UpdateBulkRemediationMutation,
  UpdateBulkRemediationMutationVariables,
  DeleteBulkRemediationMutation,
  DeleteBulkRemediationMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_REMEDIATIONS,
  CREATE_REMEDIATION,
  UPDATE_REMEDIATION,
  DELETE_REMEDIATION,
  REMEDIATION,
  CREATE_CSV_BULK_REMEDIATION,
  BULK_EDIT_REMEDIATION,
  BULK_DELETE_REMEDIATION,
} from '@repo/codegen/query/remediation'

type GetAllRemediationsArgs = {
  where?: RemediationsWithFilterQueryVariables['where']
  orderBy?: RemediationsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type RemediationsNode = NonNullable<NonNullable<NonNullable<RemediationsWithFilterQuery['remediations']>['edges']>[number]>['node']

export type RemediationsNodeNonNull = NonNullable<RemediationsNode>

export const useRemediationsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllRemediationsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<RemediationsWithFilterQuery, unknown>({
    queryKey: ['remediations', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<RemediationsWithFilterQuery> => {
      const result = await client.request<RemediationsWithFilterQuery>(GET_ALL_REMEDIATIONS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.remediations?.edges ?? []

  const remediationsNodes: RemediationsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as RemediationsNodeNonNull)

  return { ...queryResult, remediationsNodes }
}

export const useCreateRemediation = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateRemediationMutation, unknown, CreateRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useUpdateRemediation = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateRemediationMutation, unknown, UpdateRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useDeleteRemediation = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteRemediationMutation, unknown, DeleteRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useCreateBulkCSVRemediation = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvRemediationMutation, unknown, CreateBulkCsvRemediationMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_REMEDIATION, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useBulkEditRemediation = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkRemediationMutation, unknown, UpdateBulkRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useBulkDeleteRemediation = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkRemediationMutation, unknown, DeleteBulkRemediationMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_REMEDIATION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediations'] })
    },
  })
}

export const useRemediation = (remediationId?: RemediationQueryVariables['remediationId']) => {
  const { client } = useGraphQLClient()
  return useQuery<RemediationQuery, unknown>({
    queryKey: ['remediations', remediationId],
    queryFn: async (): Promise<RemediationQuery> => {
      const result = await client.request(REMEDIATION, { remediationId })
      return result as RemediationQuery
    },
    enabled: !!remediationId,
  })
}

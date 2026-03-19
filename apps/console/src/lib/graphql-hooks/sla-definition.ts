import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type SlaDefinitionsWithFilterQuery,
  type SlaDefinitionsWithFilterQueryVariables,
  type CreateSlaDefinitionMutation,
  type CreateSlaDefinitionMutationVariables,
  type UpdateSlaDefinitionMutation,
  type UpdateSlaDefinitionMutationVariables,
  type DeleteSlaDefinitionMutation,
  type DeleteSlaDefinitionMutationVariables,
  type SlaDefinitionQuery,
  type SlaDefinitionQueryVariables,
  type UpdateBulkSlaDefinitionMutation,
  type UpdateBulkSlaDefinitionMutationVariables,
  type DeleteBulkSlaDefinitionMutation,
  type DeleteBulkSlaDefinitionMutationVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_SLA_DEFINITIONS,
  CREATE_SLA_DEFINITION,
  UPDATE_SLA_DEFINITION,
  DELETE_SLA_DEFINITION,
  SLA_DEFINITION,
  BULK_EDIT_SLA_DEFINITION,
  BULK_DELETE_SLA_DEFINITION,
} from '@repo/codegen/query/sla-definition'

type GetAllSLADefinitionsArgs = {
  where?: SlaDefinitionsWithFilterQueryVariables['where']
  orderBy?: SlaDefinitionsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type SLADefinitionsNode = NonNullable<NonNullable<NonNullable<SlaDefinitionsWithFilterQuery['slaDefinitions']>['edges']>[number]>['node']

export type SLADefinitionsNodeNonNull = NonNullable<SLADefinitionsNode>

export const useSLADefinitionsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllSLADefinitionsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<SlaDefinitionsWithFilterQuery, unknown>({
    queryKey: ['slaDefinitions', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<SlaDefinitionsWithFilterQuery> => {
      const result = await client.request<SlaDefinitionsWithFilterQuery>(GET_ALL_SLA_DEFINITIONS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.slaDefinitions?.edges ?? []

  const slaDefinitionsNodes: SLADefinitionsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as SLADefinitionsNodeNonNull)

  return { ...queryResult, slaDefinitionsNodes }
}

export const useCreateSLADefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateSlaDefinitionMutation, unknown, CreateSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useUpdateSLADefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateSlaDefinitionMutation, unknown, UpdateSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useDeleteSLADefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteSlaDefinitionMutation, unknown, DeleteSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useSLADefinition = (slaDefinitionId?: SlaDefinitionQueryVariables['slaDefinitionId']) => {
  const { client } = useGraphQLClient()
  return useQuery<SlaDefinitionQuery, unknown>({
    queryKey: ['slaDefinitions', slaDefinitionId],
    queryFn: async (): Promise<SlaDefinitionQuery> => {
      const result = await client.request(SLA_DEFINITION, { slaDefinitionId })
      return result as SlaDefinitionQuery
    },
    enabled: !!slaDefinitionId,
  })
}

export const useBulkEditSLADefinition = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkSlaDefinitionMutation, unknown, UpdateBulkSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useBulkDeleteSLADefinition = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkSlaDefinitionMutation, unknown, DeleteBulkSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

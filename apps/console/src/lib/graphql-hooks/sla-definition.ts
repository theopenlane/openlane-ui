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
  type CreateBulkCsvSlaDefinitionMutation,
  type CreateBulkCsvSlaDefinitionMutationVariables,
  type UpdateBulkSlaDefinitionMutation,
  type UpdateBulkSlaDefinitionMutationVariables,
  type DeleteBulkSlaDefinitionMutation,
  type DeleteBulkSlaDefinitionMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import {
  GET_ALL_SLA_DEFINITIONS,
  CREATE_SLA_DEFINITION,
  UPDATE_SLA_DEFINITION,
  DELETE_SLA_DEFINITION,
  SLA_DEFINITION,
  CREATE_CSV_BULK_SLA_DEFINITION,
  BULK_EDIT_SLA_DEFINITION,
  BULK_DELETE_SLA_DEFINITION,
} from '@repo/codegen/query/sla-definition'

type GetAllSlaDefinitionsArgs = {
  where?: SlaDefinitionsWithFilterQueryVariables['where']
  orderBy?: SlaDefinitionsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type SlaDefinitionsNode = NonNullable<NonNullable<NonNullable<SlaDefinitionsWithFilterQuery['slaDefinitions']>['edges']>[number]>['node']

export type SlaDefinitionsNodeNonNull = NonNullable<SlaDefinitionsNode>

export const useSlaDefinitionsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllSlaDefinitionsArgs) => {
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

  const slaDefinitionsNodes: SlaDefinitionsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as SlaDefinitionsNodeNonNull)

  return { ...queryResult, slaDefinitionsNodes }
}

export const useCreateSlaDefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateSlaDefinitionMutation, unknown, CreateSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useUpdateSlaDefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateSlaDefinitionMutation, unknown, UpdateSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useDeleteSlaDefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteSlaDefinitionMutation, unknown, DeleteSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useSlaDefinition = (slaDefinitionId?: SlaDefinitionQueryVariables['slaDefinitionId']) => {
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

export const useCreateBulkCSVSlaDefinition = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvSlaDefinitionMutation, unknown, CreateBulkCsvSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_SLA_DEFINITION, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useBulkEditSlaDefinition = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkSlaDefinitionMutation, unknown, UpdateBulkSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

export const useBulkDeleteSlaDefinition = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkSlaDefinitionMutation, unknown, DeleteBulkSlaDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_SLA_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaDefinitions'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type WorkflowDefinitionsWithFilterQuery,
  type WorkflowDefinitionsWithFilterQueryVariables,
  type CreateWorkflowDefinitionMutation,
  type CreateWorkflowDefinitionMutationVariables,
  type UpdateWorkflowDefinitionMutation,
  type UpdateWorkflowDefinitionMutationVariables,
  type DeleteWorkflowDefinitionMutation,
  type DeleteWorkflowDefinitionMutationVariables,
  type WorkflowDefinitionQuery,
  type WorkflowDefinitionQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_WORKFLOW_DEFINITIONS, CREATE_WORKFLOW_DEFINITION, UPDATE_WORKFLOW_DEFINITION, DELETE_WORKFLOW_DEFINITION, WORKFLOW_DEFINITION } from '@repo/codegen/query/workflow-definition'

type GetAllWorkflowDefinitionsArgs = {
  where?: WorkflowDefinitionsWithFilterQueryVariables['where']
  orderBy?: WorkflowDefinitionsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type WorkflowDefinitionsNode = NonNullable<NonNullable<NonNullable<WorkflowDefinitionsWithFilterQuery['workflowDefinitions']>['edges']>[number]>['node']

export type WorkflowDefinitionsNodeNonNull = NonNullable<WorkflowDefinitionsNode>

export const useWorkflowDefinitionsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowDefinitionsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<WorkflowDefinitionsWithFilterQuery, unknown>({
    queryKey: ['workflowDefinitions', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowDefinitionsWithFilterQuery> => {
      const result = await client.request<WorkflowDefinitionsWithFilterQuery>(GET_ALL_WORKFLOW_DEFINITIONS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.workflowDefinitions?.edges ?? []

  const workflowDefinitionsNodes: WorkflowDefinitionsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as WorkflowDefinitionsNodeNonNull)

  return { ...queryResult, workflowDefinitionsNodes }
}

export const useCreateWorkflowDefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateWorkflowDefinitionMutation, unknown, CreateWorkflowDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowDefinitions'] })
    },
  })
}

export const useUpdateWorkflowDefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateWorkflowDefinitionMutation, unknown, UpdateWorkflowDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowDefinitions'] })
    },
  })
}

export const useDeleteWorkflowDefinition = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteWorkflowDefinitionMutation, unknown, DeleteWorkflowDefinitionMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_DEFINITION, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowDefinitions'] })
    },
  })
}

export const useWorkflowDefinition = (workflowDefinitionId?: WorkflowDefinitionQueryVariables['workflowDefinitionId']) => {
  const { client } = useGraphQLClient()
  return useQuery<WorkflowDefinitionQuery, unknown>({
    queryKey: ['workflowDefinitions', workflowDefinitionId],
    queryFn: async (): Promise<WorkflowDefinitionQuery> => {
      const result = await client.request(WORKFLOW_DEFINITION, { workflowDefinitionId })
      return result as WorkflowDefinitionQuery
    },
    enabled: !!workflowDefinitionId,
  })
}

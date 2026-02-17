import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowInstancesWithFilterQuery, WorkflowInstancesWithFilterQueryVariables, WorkflowInstanceQuery, WorkflowInstanceQueryVariables } from '@repo/codegen/src/schema'

import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_WORKFLOW_INSTANCES, WORKFLOW_INSTANCE } from '@repo/codegen/query/workflow-instance'

type GetAllWorkflowInstancesArgs = {
  where?: WorkflowInstancesWithFilterQueryVariables['where']
  orderBy?: WorkflowInstancesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type WorkflowInstancesNode = NonNullable<NonNullable<NonNullable<WorkflowInstancesWithFilterQuery['workflowInstances']>['edges']>[number]>['node']

export type WorkflowInstancesNodeNonNull = NonNullable<WorkflowInstancesNode>

export const useWorkflowInstancesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowInstancesArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<WorkflowInstancesWithFilterQuery, unknown>({
    queryKey: ['workflowInstances', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowInstancesWithFilterQuery> => {
      const result = await client.request<WorkflowInstancesWithFilterQuery>(GET_ALL_WORKFLOW_INSTANCES, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.workflowInstances?.edges ?? []

  const workflowInstancesNodes: WorkflowInstancesNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as WorkflowInstancesNodeNonNull)

  return { ...queryResult, workflowInstancesNodes }
}

export const useWorkflowInstance = (workflowInstanceId?: WorkflowInstanceQueryVariables['workflowInstanceId']) => {
  const { client } = useGraphQLClient()
  return useQuery<WorkflowInstanceQuery, unknown>({
    queryKey: ['workflowInstances', workflowInstanceId],
    queryFn: async (): Promise<WorkflowInstanceQuery> => {
      const result = await client.request(WORKFLOW_INSTANCE, { workflowInstanceId })
      return result as WorkflowInstanceQuery
    },
    enabled: !!workflowInstanceId,
  })
}

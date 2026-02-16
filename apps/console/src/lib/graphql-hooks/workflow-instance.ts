import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowInstance, WorkflowInstanceQuery, WorkflowInstanceQueryVariables, WorkflowInstancesWithFilterQuery, WorkflowInstancesWithFilterQueryVariables } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { WORKFLOW_INSTANCE, GET_ALL_WORKFLOW_INSTANCES } from '@repo/codegen/query/workflow-instance'

type GetAllWorkflowInstancesArgs = {
  where?: WorkflowInstancesWithFilterQueryVariables['where']
  orderBy?: WorkflowInstancesWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useWorkflowInstancesWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowInstancesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowInstancesWithFilterQuery, unknown>({
    queryKey: ['workflowInstances', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowInstancesWithFilterQuery> => {
      const result = await client.request(GET_ALL_WORKFLOW_INSTANCES, { where, orderBy, ...pagination?.query })
      return result as WorkflowInstancesWithFilterQuery
    },
    enabled,
  })

  const WorkflowInstances = (queryResult.data?.workflowInstances?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as WorkflowInstance[]

  return { ...queryResult, WorkflowInstances }
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

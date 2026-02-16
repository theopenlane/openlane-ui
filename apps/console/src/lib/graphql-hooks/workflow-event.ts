import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowEventsWithFilterQuery, WorkflowEventsWithFilterQueryVariables, WorkflowEventQuery, WorkflowEventQueryVariables } from '@repo/codegen/src/schema'

import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_WORKFLOW_EVENTS, WORKFLOW_EVENT } from '@repo/codegen/query/workflow-event'

type GetAllWorkflowEventsArgs = {
  where?: WorkflowEventsWithFilterQueryVariables['where']
  orderBy?: WorkflowEventsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type WorkflowEventsNode = NonNullable<NonNullable<NonNullable<WorkflowEventsWithFilterQuery['workflowEvents']>['edges']>[number]>['node']

export type WorkflowEventsNodeNonNull = NonNullable<WorkflowEventsNode>

export const useWorkflowEventsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowEventsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<WorkflowEventsWithFilterQuery, unknown>({
    queryKey: ['workflowEvents', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowEventsWithFilterQuery> => {
      const result = await client.request<WorkflowEventsWithFilterQuery>(GET_ALL_WORKFLOW_EVENTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.workflowEvents?.edges ?? []

  const workflowEventsNodes: WorkflowEventsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as WorkflowEventsNodeNonNull)

  return { ...queryResult, workflowEventsNodes }
}

export const useWorkflowEvent = (workflowEventId?: WorkflowEventQueryVariables['workflowEventId']) => {
  const { client } = useGraphQLClient()
  return useQuery<WorkflowEventQuery, unknown>({
    queryKey: ['workflowEvents', workflowEventId],
    queryFn: async (): Promise<WorkflowEventQuery> => {
      const result = await client.request(WORKFLOW_EVENT, { workflowEventId })
      return result as WorkflowEventQuery
    },
    enabled: !!workflowEventId,
  })
}

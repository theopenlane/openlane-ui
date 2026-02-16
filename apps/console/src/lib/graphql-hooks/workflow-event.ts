import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowEvent, WorkflowEventQuery, WorkflowEventQueryVariables, WorkflowEventsWithFilterQuery, WorkflowEventsWithFilterQueryVariables } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { WORKFLOW_EVENT, GET_ALL_WORKFLOW_EVENTS } from '@repo/codegen/query/workflow-event'

type GetAllWorkflowEventsArgs = {
  where?: WorkflowEventsWithFilterQueryVariables['where']
  orderBy?: WorkflowEventsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useWorkflowEventsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowEventsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowEventsWithFilterQuery, unknown>({
    queryKey: ['workflowEvents', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowEventsWithFilterQuery> => {
      const result = await client.request(GET_ALL_WORKFLOW_EVENTS, { where, orderBy, ...pagination?.query })
      return result as WorkflowEventsWithFilterQuery
    },
    enabled,
  })

  const WorkflowEvents = (queryResult.data?.workflowEvents?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as WorkflowEvent[]

  return { ...queryResult, WorkflowEvents }
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

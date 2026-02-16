import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowAssignmentsWithFilterQuery, WorkflowAssignmentsWithFilterQueryVariables, WorkflowAssignmentQuery, WorkflowAssignmentQueryVariables } from '@repo/codegen/src/schema'

import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_WORKFLOW_ASSIGNMENTS, WORKFLOW_ASSIGNMENT } from '@repo/codegen/query/workflow-assignment'

type GetAllWorkflowAssignmentsArgs = {
  where?: WorkflowAssignmentsWithFilterQueryVariables['where']
  orderBy?: WorkflowAssignmentsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type WorkflowAssignmentsNode = NonNullable<NonNullable<NonNullable<WorkflowAssignmentsWithFilterQuery['workflowAssignments']>['edges']>[number]>['node']

export type WorkflowAssignmentsNodeNonNull = NonNullable<WorkflowAssignmentsNode>

export const useWorkflowAssignmentsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowAssignmentsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<WorkflowAssignmentsWithFilterQuery, unknown>({
    queryKey: ['workflowAssignments', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowAssignmentsWithFilterQuery> => {
      const result = await client.request<WorkflowAssignmentsWithFilterQuery>(GET_ALL_WORKFLOW_ASSIGNMENTS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.workflowAssignments?.edges ?? []

  const workflowAssignmentsNodes: WorkflowAssignmentsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as WorkflowAssignmentsNodeNonNull)

  return { ...queryResult, workflowAssignmentsNodes }
}

export const useWorkflowAssignment = (workflowAssignmentId?: WorkflowAssignmentQueryVariables['workflowAssignmentId']) => {
  const { client } = useGraphQLClient()
  return useQuery<WorkflowAssignmentQuery, unknown>({
    queryKey: ['workflowAssignments', workflowAssignmentId],
    queryFn: async (): Promise<WorkflowAssignmentQuery> => {
      const result = await client.request(WORKFLOW_ASSIGNMENT, { workflowAssignmentId })
      return result as WorkflowAssignmentQuery
    },
    enabled: !!workflowAssignmentId,
  })
}

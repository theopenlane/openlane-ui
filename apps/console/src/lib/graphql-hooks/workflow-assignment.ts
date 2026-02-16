import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowAssignment,
  WorkflowAssignmentQuery,
  WorkflowAssignmentQueryVariables,
  WorkflowAssignmentsWithFilterQuery,
  WorkflowAssignmentsWithFilterQueryVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { WORKFLOW_ASSIGNMENT, GET_ALL_WORKFLOW_ASSIGNMENTS } from '@repo/codegen/query/workflow-assignment'

type GetAllWorkflowAssignmentsArgs = {
  where?: WorkflowAssignmentsWithFilterQueryVariables['where']
  orderBy?: WorkflowAssignmentsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useWorkflowAssignmentsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowAssignmentsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowAssignmentsWithFilterQuery, unknown>({
    queryKey: ['workflowAssignments', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowAssignmentsWithFilterQuery> => {
      const result = await client.request(GET_ALL_WORKFLOW_ASSIGNMENTS, { where, orderBy, ...pagination?.query })
      return result as WorkflowAssignmentsWithFilterQuery
    },
    enabled,
  })

  const WorkflowAssignments = (queryResult.data?.workflowAssignments?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as WorkflowAssignment[]

  return { ...queryResult, WorkflowAssignments }
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

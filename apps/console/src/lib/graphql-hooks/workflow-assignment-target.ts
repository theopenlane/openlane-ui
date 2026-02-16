import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowAssignmentTarget,
  WorkflowAssignmentTargetQuery,
  WorkflowAssignmentTargetQueryVariables,
  WorkflowAssignmentTargetsWithFilterQuery,
  WorkflowAssignmentTargetsWithFilterQueryVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { WORKFLOW_ASSIGNMENT_TARGET, GET_ALL_WORKFLOW_ASSIGNMENT_TARGETS } from '@repo/codegen/query/workflow-assignment-target'

type GetAllWorkflowAssignmentTargetsArgs = {
  where?: WorkflowAssignmentTargetsWithFilterQueryVariables['where']
  orderBy?: WorkflowAssignmentTargetsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useWorkflowAssignmentTargetsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowAssignmentTargetsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowAssignmentTargetsWithFilterQuery, unknown>({
    queryKey: ['workflowAssignmentTargets', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowAssignmentTargetsWithFilterQuery> => {
      const result = await client.request(GET_ALL_WORKFLOW_ASSIGNMENT_TARGETS, { where, orderBy, ...pagination?.query })
      return result as WorkflowAssignmentTargetsWithFilterQuery
    },
    enabled,
  })

  const WorkflowAssignmentTargets = (queryResult.data?.workflowAssignmentTargets?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as WorkflowAssignmentTarget[]

  return { ...queryResult, WorkflowAssignmentTargets }
}

export const useWorkflowAssignmentTarget = (workflowAssignmentTargetId?: WorkflowAssignmentTargetQueryVariables['workflowAssignmentTargetId']) => {
  const { client } = useGraphQLClient()

  return useQuery<WorkflowAssignmentTargetQuery, unknown>({
    queryKey: ['workflowAssignmentTargets', workflowAssignmentTargetId],
    queryFn: async (): Promise<WorkflowAssignmentTargetQuery> => {
      const result = await client.request(WORKFLOW_ASSIGNMENT_TARGET, { workflowAssignmentTargetId })
      return result as WorkflowAssignmentTargetQuery
    },
    enabled: !!workflowAssignmentTargetId,
  })
}

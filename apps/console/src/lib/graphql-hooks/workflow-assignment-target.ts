import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type WorkflowAssignmentTargetsWithFilterQuery,
  type WorkflowAssignmentTargetsWithFilterQueryVariables,
  type WorkflowAssignmentTargetQuery,
  type WorkflowAssignmentTargetQueryVariables,
} from '@repo/codegen/src/schema'

import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_WORKFLOW_ASSIGNMENT_TARGETS, WORKFLOW_ASSIGNMENT_TARGET } from '@repo/codegen/query/workflow-assignment-target'

type GetAllWorkflowAssignmentTargetsArgs = {
  where?: WorkflowAssignmentTargetsWithFilterQueryVariables['where']
  orderBy?: WorkflowAssignmentTargetsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type WorkflowAssignmentTargetsNode = NonNullable<NonNullable<NonNullable<WorkflowAssignmentTargetsWithFilterQuery['workflowAssignmentTargets']>['edges']>[number]>['node']

export type WorkflowAssignmentTargetsNodeNonNull = NonNullable<WorkflowAssignmentTargetsNode>

export const useWorkflowAssignmentTargetsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowAssignmentTargetsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<WorkflowAssignmentTargetsWithFilterQuery, unknown>({
    queryKey: ['workflowAssignmentTargets', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowAssignmentTargetsWithFilterQuery> => {
      const result = await client.request<WorkflowAssignmentTargetsWithFilterQuery>(GET_ALL_WORKFLOW_ASSIGNMENT_TARGETS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.workflowAssignmentTargets?.edges ?? []

  const workflowAssignmentTargetsNodes: WorkflowAssignmentTargetsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as WorkflowAssignmentTargetsNodeNonNull)

  return { ...queryResult, workflowAssignmentTargetsNodes }
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

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowObjectRefsWithFilterQuery, WorkflowObjectRefsWithFilterQueryVariables, WorkflowObjectRefQuery, WorkflowObjectRefQueryVariables } from '@repo/codegen/src/schema'

import { TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_WORKFLOW_OBJECT_REFS, WORKFLOW_OBJECT_REF } from '@repo/codegen/query/workflow-object-ref'

type GetAllWorkflowObjectRefsArgs = {
  where?: WorkflowObjectRefsWithFilterQueryVariables['where']
  orderBy?: WorkflowObjectRefsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type WorkflowObjectRefsNode = NonNullable<NonNullable<NonNullable<WorkflowObjectRefsWithFilterQuery['workflowObjectRefs']>['edges']>[number]>['node']

export type WorkflowObjectRefsNodeNonNull = NonNullable<WorkflowObjectRefsNode>

export const useWorkflowObjectRefsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowObjectRefsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<WorkflowObjectRefsWithFilterQuery, unknown>({
    queryKey: ['workflowObjectRefs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowObjectRefsWithFilterQuery> => {
      const result = await client.request<WorkflowObjectRefsWithFilterQuery>(GET_ALL_WORKFLOW_OBJECT_REFS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const edges = queryResult.data?.workflowObjectRefs?.edges ?? []

  const workflowObjectRefsNodes: WorkflowObjectRefsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as WorkflowObjectRefsNodeNonNull)

  return { ...queryResult, workflowObjectRefsNodes }
}

export const useWorkflowObjectRef = (workflowObjectRefId?: WorkflowObjectRefQueryVariables['workflowObjectRefId']) => {
  const { client } = useGraphQLClient()
  return useQuery<WorkflowObjectRefQuery, unknown>({
    queryKey: ['workflowObjectRefs', workflowObjectRefId],
    queryFn: async (): Promise<WorkflowObjectRefQuery> => {
      const result = await client.request(WORKFLOW_OBJECT_REF, { workflowObjectRefId })
      return result as WorkflowObjectRefQuery
    },
    enabled: !!workflowObjectRefId,
  })
}

import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowObjectRef, WorkflowObjectRefQuery, WorkflowObjectRefQueryVariables, WorkflowObjectRefsWithFilterQuery, WorkflowObjectRefsWithFilterQueryVariables } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { WORKFLOW_OBJECT_REF, GET_ALL_WORKFLOW_OBJECT_REFS } from '@repo/codegen/query/workflow-object-ref'

type GetAllWorkflowObjectRefsArgs = {
  where?: WorkflowObjectRefsWithFilterQueryVariables['where']
  orderBy?: WorkflowObjectRefsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useWorkflowObjectRefsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowObjectRefsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowObjectRefsWithFilterQuery, unknown>({
    queryKey: ['workflowObjectRefs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowObjectRefsWithFilterQuery> => {
      const result = await client.request(GET_ALL_WORKFLOW_OBJECT_REFS, { where, orderBy, ...pagination?.query })
      return result as WorkflowObjectRefsWithFilterQuery
    },
    enabled,
  })

  const WorkflowObjectRefs = (queryResult.data?.workflowObjectRefs?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as WorkflowObjectRef[]

  return { ...queryResult, WorkflowObjectRefs }
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

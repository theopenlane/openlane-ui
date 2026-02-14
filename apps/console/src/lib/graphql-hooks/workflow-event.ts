import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowEvent,
  WorkflowEventQuery,
  WorkflowEventQueryVariables,
  WorkflowEventsWithFilterQuery,
  WorkflowEventsWithFilterQueryVariables,
  CreateWorkflowEventMutation,
  CreateWorkflowEventMutationVariables,
  CreateBulkCsvWorkflowEventMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteWorkflowEventMutation,
  DeleteWorkflowEventMutationVariables,
  DeleteBulkWorkflowEventMutation,
  DeleteBulkWorkflowEventMutationVariables,
  UpdateWorkflowEventMutation,
  UpdateWorkflowEventMutationVariables,
  UpdateBulkWorkflowEventMutation,
  UpdateBulkWorkflowEventMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  WORKFLOW_EVENT,
  GET_ALL_WORKFLOW_EVENTS,
  BULK_DELETE_WORKFLOW_EVENT,
  CREATE_WORKFLOW_EVENT,
  CREATE_CSV_BULK_WORKFLOW_EVENT,
  DELETE_WORKFLOW_EVENT,
  UPDATE_WORKFLOW_EVENT,
  BULK_EDIT_WORKFLOW_EVENT,
} from '@repo/codegen/query/workflow-event'

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

export const useCreateWorkflowEvent = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateWorkflowEventMutation, unknown, CreateWorkflowEventMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_EVENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowEvents'] })
    },
  })
}

export const useUpdateWorkflowEvent = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateWorkflowEventMutation, unknown, UpdateWorkflowEventMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_EVENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowEvents'] })
    },
  })
}

export const useDeleteWorkflowEvent = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteWorkflowEventMutation, unknown, DeleteWorkflowEventMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_EVENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowEvents'] })
    },
  })
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

export const useCreateBulkCSVWorkflowEvent = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvWorkflowEventMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_WORKFLOW_EVENT, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowEvents'] })
    },
  })
}

export const useBulkEditWorkflowEvent = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkWorkflowEventMutation, unknown, UpdateBulkWorkflowEventMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_WORKFLOW_EVENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowEvents'] })
    },
  })
}

export const useBulkDeleteWorkflowEvent = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkWorkflowEventMutation, unknown, DeleteBulkWorkflowEventMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_WORKFLOW_EVENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowEvents'] })
    },
  })
}

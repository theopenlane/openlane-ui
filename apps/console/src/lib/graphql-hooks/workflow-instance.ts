import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowInstance,
  WorkflowInstanceQuery,
  WorkflowInstanceQueryVariables,
  WorkflowInstancesWithFilterQuery,
  WorkflowInstancesWithFilterQueryVariables,
  CreateWorkflowInstanceMutation,
  CreateWorkflowInstanceMutationVariables,
  CreateBulkCsvWorkflowInstanceMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteWorkflowInstanceMutation,
  DeleteWorkflowInstanceMutationVariables,
  DeleteBulkWorkflowInstanceMutation,
  DeleteBulkWorkflowInstanceMutationVariables,
  UpdateWorkflowInstanceMutation,
  UpdateWorkflowInstanceMutationVariables,
  UpdateBulkWorkflowInstanceMutation,
  UpdateBulkWorkflowInstanceMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  WORKFLOW_INSTANCE,
  GET_ALL_WORKFLOW_INSTANCES,
  BULK_DELETE_WORKFLOW_INSTANCE,
  CREATE_WORKFLOW_INSTANCE,
  CREATE_CSV_BULK_WORKFLOW_INSTANCE,
  DELETE_WORKFLOW_INSTANCE,
  UPDATE_WORKFLOW_INSTANCE,
  BULK_EDIT_WORKFLOW_INSTANCE,
} from '@repo/codegen/query/workflow-instance'

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

export const useCreateWorkflowInstance = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateWorkflowInstanceMutation, unknown, CreateWorkflowInstanceMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_INSTANCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] })
    },
  })
}

export const useUpdateWorkflowInstance = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateWorkflowInstanceMutation, unknown, UpdateWorkflowInstanceMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_INSTANCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] })
    },
  })
}

export const useDeleteWorkflowInstance = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteWorkflowInstanceMutation, unknown, DeleteWorkflowInstanceMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_INSTANCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] })
    },
  })
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

export const useCreateBulkCSVWorkflowInstance = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvWorkflowInstanceMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_WORKFLOW_INSTANCE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] })
    },
  })
}

export const useBulkEditWorkflowInstance = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkWorkflowInstanceMutation, unknown, UpdateBulkWorkflowInstanceMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_WORKFLOW_INSTANCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] })
    },
  })
}

export const useBulkDeleteWorkflowInstance = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkWorkflowInstanceMutation, unknown, DeleteBulkWorkflowInstanceMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_WORKFLOW_INSTANCE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowInstances'] })
    },
  })
}

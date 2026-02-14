import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowAssignment,
  WorkflowAssignmentQuery,
  WorkflowAssignmentQueryVariables,
  WorkflowAssignmentsWithFilterQuery,
  WorkflowAssignmentsWithFilterQueryVariables,
  CreateWorkflowAssignmentMutation,
  CreateWorkflowAssignmentMutationVariables,
  CreateBulkCsvWorkflowAssignmentMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteWorkflowAssignmentMutation,
  DeleteWorkflowAssignmentMutationVariables,
  DeleteBulkWorkflowAssignmentMutation,
  DeleteBulkWorkflowAssignmentMutationVariables,
  UpdateWorkflowAssignmentMutation,
  UpdateWorkflowAssignmentMutationVariables,
  UpdateBulkWorkflowAssignmentMutation,
  UpdateBulkWorkflowAssignmentMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  WORKFLOW_ASSIGNMENT,
  GET_ALL_WORKFLOW_ASSIGNMENTS,
  BULK_DELETE_WORKFLOW_ASSIGNMENT,
  CREATE_WORKFLOW_ASSIGNMENT,
  CREATE_CSV_BULK_WORKFLOW_ASSIGNMENT,
  DELETE_WORKFLOW_ASSIGNMENT,
  UPDATE_WORKFLOW_ASSIGNMENT,
  BULK_EDIT_WORKFLOW_ASSIGNMENT,
} from '@repo/codegen/query/workflow-assignment'

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

export const useCreateWorkflowAssignment = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateWorkflowAssignmentMutation, unknown, CreateWorkflowAssignmentMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_ASSIGNMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignments'] })
    },
  })
}

export const useUpdateWorkflowAssignment = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateWorkflowAssignmentMutation, unknown, UpdateWorkflowAssignmentMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_ASSIGNMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignments'] })
    },
  })
}

export const useDeleteWorkflowAssignment = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteWorkflowAssignmentMutation, unknown, DeleteWorkflowAssignmentMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_ASSIGNMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignments'] })
    },
  })
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

export const useCreateBulkCSVWorkflowAssignment = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvWorkflowAssignmentMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_WORKFLOW_ASSIGNMENT, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignments'] })
    },
  })
}

export const useBulkEditWorkflowAssignment = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkWorkflowAssignmentMutation, unknown, UpdateBulkWorkflowAssignmentMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_WORKFLOW_ASSIGNMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignments'] })
    },
  })
}

export const useBulkDeleteWorkflowAssignment = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkWorkflowAssignmentMutation, unknown, DeleteBulkWorkflowAssignmentMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_WORKFLOW_ASSIGNMENT, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignments'] })
    },
  })
}

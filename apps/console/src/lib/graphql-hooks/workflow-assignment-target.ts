import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowAssignmentTarget,
  WorkflowAssignmentTargetQuery,
  WorkflowAssignmentTargetQueryVariables,
  WorkflowAssignmentTargetsWithFilterQuery,
  WorkflowAssignmentTargetsWithFilterQueryVariables,
  CreateWorkflowAssignmentTargetMutation,
  CreateWorkflowAssignmentTargetMutationVariables,
  CreateBulkCsvWorkflowAssignmentTargetMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteWorkflowAssignmentTargetMutation,
  DeleteWorkflowAssignmentTargetMutationVariables,
  DeleteBulkWorkflowAssignmentTargetMutation,
  DeleteBulkWorkflowAssignmentTargetMutationVariables,
  UpdateWorkflowAssignmentTargetMutation,
  UpdateWorkflowAssignmentTargetMutationVariables,
  UpdateBulkWorkflowAssignmentTargetMutation,
  UpdateBulkWorkflowAssignmentTargetMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  WORKFLOW_ASSIGNMENT_TARGET,
  GET_ALL_WORKFLOW_ASSIGNMENT_TARGETS,
  BULK_DELETE_WORKFLOW_ASSIGNMENT_TARGET,
  CREATE_WORKFLOW_ASSIGNMENT_TARGET,
  CREATE_CSV_BULK_WORKFLOW_ASSIGNMENT_TARGET,
  DELETE_WORKFLOW_ASSIGNMENT_TARGET,
  UPDATE_WORKFLOW_ASSIGNMENT_TARGET,
  BULK_EDIT_WORKFLOW_ASSIGNMENT_TARGET,
} from '@repo/codegen/query/workflow-assignment-target'

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

export const useCreateWorkflowAssignmentTarget = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateWorkflowAssignmentTargetMutation, unknown, CreateWorkflowAssignmentTargetMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_ASSIGNMENT_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignmentTargets'] })
    },
  })
}

export const useUpdateWorkflowAssignmentTarget = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateWorkflowAssignmentTargetMutation, unknown, UpdateWorkflowAssignmentTargetMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_ASSIGNMENT_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignmentTargets'] })
    },
  })
}

export const useDeleteWorkflowAssignmentTarget = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteWorkflowAssignmentTargetMutation, unknown, DeleteWorkflowAssignmentTargetMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_ASSIGNMENT_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignmentTargets'] })
    },
  })
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

export const useCreateBulkCSVWorkflowAssignmentTarget = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvWorkflowAssignmentTargetMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_WORKFLOW_ASSIGNMENT_TARGET, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignmentTargets'] })
    },
  })
}

export const useBulkEditWorkflowAssignmentTarget = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkWorkflowAssignmentTargetMutation, unknown, UpdateBulkWorkflowAssignmentTargetMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_WORKFLOW_ASSIGNMENT_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignmentTargets'] })
    },
  })
}

export const useBulkDeleteWorkflowAssignmentTarget = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkWorkflowAssignmentTargetMutation, unknown, DeleteBulkWorkflowAssignmentTargetMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_WORKFLOW_ASSIGNMENT_TARGET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowAssignmentTargets'] })
    },
  })
}

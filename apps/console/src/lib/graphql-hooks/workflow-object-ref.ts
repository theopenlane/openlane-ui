import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowObjectRef,
  WorkflowObjectRefQuery,
  WorkflowObjectRefQueryVariables,
  WorkflowObjectRefsWithFilterQuery,
  WorkflowObjectRefsWithFilterQueryVariables,
  CreateWorkflowObjectRefMutation,
  CreateWorkflowObjectRefMutationVariables,
  CreateBulkCsvWorkflowObjectRefMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteWorkflowObjectRefMutation,
  DeleteWorkflowObjectRefMutationVariables,
  DeleteBulkWorkflowObjectRefMutation,
  DeleteBulkWorkflowObjectRefMutationVariables,
  UpdateWorkflowObjectRefMutation,
  UpdateWorkflowObjectRefMutationVariables,
  UpdateBulkWorkflowObjectRefMutation,
  UpdateBulkWorkflowObjectRefMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  WORKFLOW_OBJECT_REF,
  GET_ALL_WORKFLOW_OBJECT_REFS,
  BULK_DELETE_WORKFLOW_OBJECT_REF,
  CREATE_WORKFLOW_OBJECT_REF,
  CREATE_CSV_BULK_WORKFLOW_OBJECT_REF,
  DELETE_WORKFLOW_OBJECT_REF,
  UPDATE_WORKFLOW_OBJECT_REF,
  BULK_EDIT_WORKFLOW_OBJECT_REF,
} from '@repo/codegen/query/workflow-object-ref'

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

export const useCreateWorkflowObjectRef = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateWorkflowObjectRefMutation, unknown, CreateWorkflowObjectRefMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_OBJECT_REF, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowObjectRefs'] })
    },
  })
}

export const useUpdateWorkflowObjectRef = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateWorkflowObjectRefMutation, unknown, UpdateWorkflowObjectRefMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_OBJECT_REF, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowObjectRefs'] })
    },
  })
}

export const useDeleteWorkflowObjectRef = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteWorkflowObjectRefMutation, unknown, DeleteWorkflowObjectRefMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_OBJECT_REF, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowObjectRefs'] })
    },
  })
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

export const useCreateBulkCSVWorkflowObjectRef = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvWorkflowObjectRefMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_WORKFLOW_OBJECT_REF, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowObjectRefs'] })
    },
  })
}

export const useBulkEditWorkflowObjectRef = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkWorkflowObjectRefMutation, unknown, UpdateBulkWorkflowObjectRefMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_WORKFLOW_OBJECT_REF, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowObjectRefs'] })
    },
  })
}

export const useBulkDeleteWorkflowObjectRef = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkWorkflowObjectRefMutation, unknown, DeleteBulkWorkflowObjectRefMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_WORKFLOW_OBJECT_REF, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowObjectRefs'] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  WorkflowProposal,
  WorkflowProposalQuery,
  WorkflowProposalQueryVariables,
  WorkflowProposalsWithFilterQuery,
  WorkflowProposalsWithFilterQueryVariables,
  CreateWorkflowProposalMutation,
  CreateWorkflowProposalMutationVariables,
  CreateBulkCsvWorkflowProposalMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteWorkflowProposalMutation,
  DeleteWorkflowProposalMutationVariables,
  DeleteBulkWorkflowProposalMutation,
  DeleteBulkWorkflowProposalMutationVariables,
  UpdateWorkflowProposalMutation,
  UpdateWorkflowProposalMutationVariables,
  UpdateBulkWorkflowProposalMutation,
  UpdateBulkWorkflowProposalMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import {
  WORKFLOW_PROPOSAL,
  GET_ALL_WORKFLOW_PROPOSALS,
  BULK_DELETE_WORKFLOW_PROPOSAL,
  CREATE_WORKFLOW_PROPOSAL,
  CREATE_CSV_BULK_WORKFLOW_PROPOSAL,
  DELETE_WORKFLOW_PROPOSAL,
  UPDATE_WORKFLOW_PROPOSAL,
  BULK_EDIT_WORKFLOW_PROPOSAL,
} from '@repo/codegen/query/workflow-proposal'

type GetAllWorkflowProposalsArgs = {
  where?: WorkflowProposalsWithFilterQueryVariables['where']
  orderBy?: WorkflowProposalsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useWorkflowProposalsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllWorkflowProposalsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<WorkflowProposalsWithFilterQuery, unknown>({
    queryKey: ['workflowProposals', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<WorkflowProposalsWithFilterQuery> => {
      const result = await client.request(GET_ALL_WORKFLOW_PROPOSALS, { where, orderBy, ...pagination?.query })
      return result as WorkflowProposalsWithFilterQuery
    },
    enabled,
  })

  const WorkflowProposals = (queryResult.data?.workflowProposals?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as WorkflowProposal[]

  return { ...queryResult, WorkflowProposals }
}

export const useCreateWorkflowProposal = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateWorkflowProposalMutation, unknown, CreateWorkflowProposalMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_WORKFLOW_PROPOSAL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowProposals'] })
    },
  })
}

export const useUpdateWorkflowProposal = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<UpdateWorkflowProposalMutation, unknown, UpdateWorkflowProposalMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_WORKFLOW_PROPOSAL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowProposals'] })
    },
  })
}

export const useDeleteWorkflowProposal = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteWorkflowProposalMutation, unknown, DeleteWorkflowProposalMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_WORKFLOW_PROPOSAL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowProposals'] })
    },
  })
}

export const useWorkflowProposal = (workflowProposalId?: WorkflowProposalQueryVariables['workflowProposalId']) => {
  const { client } = useGraphQLClient()

  return useQuery<WorkflowProposalQuery, unknown>({
    queryKey: ['workflowProposals', workflowProposalId],
    queryFn: async (): Promise<WorkflowProposalQuery> => {
      const result = await client.request(WORKFLOW_PROPOSAL, { workflowProposalId })
      return result as WorkflowProposalQuery
    },
    enabled: !!workflowProposalId,
  })
}

export const useCreateBulkCSVWorkflowProposal = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvWorkflowProposalMutation, unknown, CreateBulkCsvTaskMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_WORKFLOW_PROPOSAL, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowProposals'] })
    },
  })
}

export const useBulkEditWorkflowProposal = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkWorkflowProposalMutation, unknown, UpdateBulkWorkflowProposalMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_WORKFLOW_PROPOSAL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowProposals'] })
    },
  })
}

export const useBulkDeleteWorkflowProposal = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkWorkflowProposalMutation, unknown, DeleteBulkWorkflowProposalMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_WORKFLOW_PROPOSAL, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowProposals'] })
    },
  })
}

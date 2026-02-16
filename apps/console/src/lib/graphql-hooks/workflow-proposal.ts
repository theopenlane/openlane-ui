import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { WorkflowProposalQuery, WorkflowProposalQueryVariables } from '@repo/codegen/src/schema'
import { WORKFLOW_PROPOSAL } from '@repo/codegen/query/workflow-proposal'

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

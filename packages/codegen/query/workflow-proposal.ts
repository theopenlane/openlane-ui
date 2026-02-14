import { gql } from 'graphql-request'

export const WORKFLOW_PROPOSAL = gql`
  query WorkflowProposal($workflowProposalId: ID!) {
    workflowProposal(id: $workflowProposalId) {
      approvedHash
      changes
      createdAt
      createdBy
      domainKey
      id
      proposedHash
      revision
      submittedAt
      submittedByUserID
      updatedAt
      updatedBy
      workflowObjectRefID
    }
  }
`

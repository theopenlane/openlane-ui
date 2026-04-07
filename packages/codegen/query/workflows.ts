import { gql } from 'graphql-request'

export const GET_WORKFLOW_METADATA = gql`
  query WorkflowMetadata {
    workflowMetadata {
      objectTypes {
        type
        label
        description
        resolverKeys
        eligibleEdges
        eligibleFields {
          name
          label
          type
        }
      }
    }
  }
`

export const GET_WORKFLOW_PROPOSALS_FOR_OBJECT = gql`
  query GetWorkflowProposalsForObject($objectType: String!, $objectID: ID!, $includeStates: [WorkflowProposalState!]) {
    workflowProposalsForObject(objectType: $objectType, objectID: $objectID, includeStates: $includeStates) {
      id
      state
      domainKey
      revision
      changes
      createdAt
      updatedAt
      submittedAt
    }
  }
`

export const APPROVE_WORKFLOW_ASSIGNMENT = gql`
  mutation ApproveWorkflowAssignment($id: ID!) {
    approveWorkflowAssignment(id: $id) {
      workflowAssignment {
        id
        status
        decidedAt
      }
    }
  }
`

export const REJECT_WORKFLOW_ASSIGNMENT = gql`
  mutation RejectWorkflowAssignment($id: ID!, $reason: String) {
    rejectWorkflowAssignment(id: $id, reason: $reason) {
      workflowAssignment {
        id
        status
        decidedAt
      }
    }
  }
`

export const REQUEST_CHANGES_WORKFLOW_ASSIGNMENT = gql`
  mutation RequestChangesWorkflowAssignment($id: ID!, $reason: String, $inputs: Map) {
    requestChangesWorkflowAssignment(id: $id, reason: $reason, inputs: $inputs) {
      workflowAssignment {
        id
        status
        decidedAt
      }
    }
  }
`

export const REASSIGN_WORKFLOW_ASSIGNMENT = gql`
  mutation ReassignWorkflowAssignment($id: ID!, $targetUserID: ID!) {
    reassignWorkflowAssignment(id: $id, targetUserID: $targetUserID) {
      id
      status
      assignmentKey
    }
  }
`

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

export const GET_WORKFLOW_INSTANCES = gql`
  query GetWorkflowInstances($first: Int, $where: WorkflowInstanceWhereInput) {
    workflowInstances(first: $first, where: $where) {
      edges {
        node {
          id
          state
          context
          definitionSnapshot
          createdAt
          updatedAt
          workflowProposalID
          workflowDefinition {
            id
            name
            schemaType
            workflowKind
            definitionJSON
          }
          workflowAssignments(first: 100) {
            edges {
              node {
                id
                status
                assignmentKey
                label
                metadata
                createdAt
                decidedAt
                actorUserID
                actorGroupID
              }
            }
          }
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

export const GET_WORKFLOW_ASSIGNMENTS = gql`
  query GetWorkflowAssignments($organizationId: ID!, $first: Int, $where: WorkflowAssignmentWhereInput, $orderBy: [WorkflowAssignmentOrder!]) {
    organization(id: $organizationId) {
      workflowAssignments(first: $first, where: $where, orderBy: $orderBy) {
        totalCount
        edges {
          node {
            id
            assignmentKey
            label
            status
            role
            approvalMetadata
            rejectionMetadata
            metadata
            createdAt
            decidedAt
            workflowInstance {
              id
              state
              context
              controlID
              subcontrolID
              evidenceID
              internalPolicyID
              procedureID
              workflowDefinition {
                id
                name
                schemaType
                workflowKind
                definitionJSON
              }
              definitionSnapshot
            }
            workflowAssignmentTargets(first: 50) {
              edges {
                node {
                  id
                  targetType
                  targetUserID
                  targetGroupID
                  resolverKey
                }
              }
            }
          }
        }
      }
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

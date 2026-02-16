import { gql } from 'graphql-request'

export const GET_ALL_WORKFLOW_ASSIGNMENTS = gql`
  query WorkflowAssignmentsWithFilter($where: WorkflowAssignmentWhereInput, $orderBy: [WorkflowAssignmentOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    workflowAssignments(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          actorGroupID
          actorUserID
          approvalMetadata
          assignmentKey
          createdAt
          createdBy
          decidedAt
          displayID
          dueAt
          id
          invalidationMetadata
          label
          metadata
          notes
          rejectionMetadata
          required
          role
          updatedAt
          updatedBy
          workflowInstanceID
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`

export const WORKFLOW_ASSIGNMENT = gql`
  query WorkflowAssignment($workflowAssignmentId: ID!) {
    workflowAssignment(id: $workflowAssignmentId) {
      actorGroupID
      actorUserID
      approvalMetadata
      assignmentKey
      createdAt
      createdBy
      decidedAt
      displayID
      dueAt
      id
      invalidationMetadata
      label
      metadata
      notes
      rejectionMetadata
      required
      role
      updatedAt
      updatedBy
      workflowInstanceID
    }
  }
`

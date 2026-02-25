import { gql } from 'graphql-request'

export const GET_ALL_WORKFLOW_ASSIGNMENT_TARGETS = gql`
  query WorkflowAssignmentTargetsWithFilter($where: WorkflowAssignmentTargetWhereInput, $orderBy: [WorkflowAssignmentTargetOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    workflowAssignmentTargets(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          displayID
          id
          resolverKey
          targetGroupID
          targetUserID
          updatedAt
          updatedBy
          workflowAssignmentID
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

export const WORKFLOW_ASSIGNMENT_TARGET = gql`
  query WorkflowAssignmentTarget($workflowAssignmentTargetId: ID!) {
    workflowAssignmentTarget(id: $workflowAssignmentTargetId) {
      createdAt
      createdBy
      displayID
      id
      resolverKey
      targetGroupID
      targetUserID
      updatedAt
      updatedBy
      workflowAssignmentID
    }
  }
`

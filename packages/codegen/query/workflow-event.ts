import { gql } from 'graphql-request'

export const GET_ALL_WORKFLOW_EVENTS = gql`
  query WorkflowEventsWithFilter($where: WorkflowEventWhereInput, $orderBy: [WorkflowEventOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    workflowEvents(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          displayID
          id
          payload
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

export const WORKFLOW_EVENT = gql`
  query WorkflowEvent($workflowEventId: ID!) {
    workflowEvent(id: $workflowEventId) {
      createdAt
      createdBy
      displayID
      id
      payload
      updatedAt
      updatedBy
      workflowInstanceID
    }
  }
`

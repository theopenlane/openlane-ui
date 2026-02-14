import { gql } from 'graphql-request'

export const GET_ALL_ACTION_PLANS = gql`
  query ActionPlansWithFilter($where: ActionPlanWhereInput, $orderBy: [ActionPlanOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    actionPlans(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          actionPlanKindID
          actionPlanKindName
          approvalRequired
          approverID
          blocked
          blockerReason
          completedAt
          createdAt
          createdBy
          delegateID
          description
          details
          dueDate
          fileID
          hasPendingWorkflow
          hasWorkflowHistory
          id
          metadata
          name
          rawPayload
          requiresApproval
          reviewDue
          revision
          source
          summary
          systemOwned
          title
          updatedAt
          updatedBy
          url
          workflowEligibleMarker
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

export const ACTION_PLAN = gql`
  query ActionPlan($actionPlanId: ID!) {
    actionPlan(id: $actionPlanId) {
      actionPlanKindID
      actionPlanKindName
      approvalRequired
      approverID
      blocked
      blockerReason
      completedAt
      createdAt
      createdBy
      delegateID
      description
      details
      dueDate
      fileID
      hasPendingWorkflow
      hasWorkflowHistory
      id
      metadata
      name
      rawPayload
      requiresApproval
      reviewDue
      revision
      source
      summary
      systemOwned
      title
      updatedAt
      updatedBy
      url
      workflowEligibleMarker
    }
  }
`

export const CREATE_ACTION_PLAN = gql`
  mutation CreateActionPlan($input: CreateActionPlanInput!) {
    createActionPlan(input: $input) {
      actionPlan {
        id
      }
    }
  }
`

export const UPDATE_ACTION_PLAN = gql`
  mutation UpdateActionPlan($updateActionPlanId: ID!, $input: UpdateActionPlanInput!) {
    updateActionPlan(id: $updateActionPlanId, input: $input) {
      actionPlan {
        id
      }
    }
  }
`

export const DELETE_ACTION_PLAN = gql`
  mutation DeleteActionPlan($deleteActionPlanId: ID!) {
    deleteActionPlan(id: $deleteActionPlanId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_ACTION_PLAN = gql`
  mutation CreateBulkCSVActionPlan($input: Upload!) {
    createBulkCSVActionPlan(input: $input) {
      actionPlans {
        id
      }
    }
  }
`

export const BULK_DELETE_ACTION_PLAN = gql`
  mutation DeleteBulkActionPlan($ids: [ID!]!) {
    deleteBulkActionPlan(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_ACTION_PLAN = gql`
  mutation UpdateBulkActionPlan($ids: [ID!]!, $input: UpdateActionPlanInput!) {
    updateBulkActionPlan(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

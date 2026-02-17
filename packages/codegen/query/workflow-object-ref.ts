import { gql } from 'graphql-request'

export const GET_ALL_WORKFLOW_OBJECT_REFS = gql`
  query WorkflowObjectRefsWithFilter($where: WorkflowObjectRefWhereInput, $orderBy: [WorkflowObjectRefOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    workflowObjectRefs(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          actionPlanID
          campaignID
          campaignTargetID
          controlID
          createdAt
          createdBy
          directoryAccountID
          directoryGroupID
          directoryMembershipID
          displayID
          evidenceID
          findingID
          id
          identityHolderID
          internalPolicyID
          platformID
          procedureID
          subcontrolID
          taskID
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

export const WORKFLOW_OBJECT_REF = gql`
  query WorkflowObjectRef($workflowObjectRefId: ID!) {
    workflowObjectRef(id: $workflowObjectRefId) {
      actionPlanID
      campaignID
      campaignTargetID
      controlID
      createdAt
      createdBy
      directoryAccountID
      directoryGroupID
      directoryMembershipID
      displayID
      evidenceID
      findingID
      id
      identityHolderID
      internalPolicyID
      platformID
      procedureID
      subcontrolID
      taskID
      updatedAt
      updatedBy
      workflowInstanceID
    }
  }
`

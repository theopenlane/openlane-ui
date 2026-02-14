import { gql } from 'graphql-request'

export const GET_ALL_WORKFLOW_INSTANCES = gql`
  query WorkflowInstancesWithFilter($where: WorkflowInstanceWhereInput, $orderBy: [WorkflowInstanceOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    workflowInstances(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          actionPlanID
          campaignID
          campaignTargetID
          context
          controlID
          createdAt
          createdBy
          currentActionIndex
          definitionSnapshot
          displayID
          evidenceID
          id
          identityHolderID
          internalPolicyID
          lastEvaluatedAt
          platformID
          procedureID
          subcontrolID
          updatedAt
          updatedBy
          workflowDefinitionID
          workflowProposalID
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

export const WORKFLOW_INSTANCE = gql`
  query WorkflowInstance($workflowInstanceId: ID!) {
    workflowInstance(id: $workflowInstanceId) {
      actionPlanID
      campaignID
      campaignTargetID
      context
      controlID
      createdAt
      createdBy
      currentActionIndex
      definitionSnapshot
      displayID
      evidenceID
      id
      identityHolderID
      internalPolicyID
      lastEvaluatedAt
      platformID
      procedureID
      subcontrolID
      updatedAt
      updatedBy
      workflowDefinitionID
      workflowProposalID
    }
  }
`

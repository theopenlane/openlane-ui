import { gql } from 'graphql-request'

export const GET_ALL_CAMPAIGN_TARGETS = gql`
  query CampaignTargetsWithFilter($where: CampaignTargetWhereInput, $orderBy: [CampaignTargetOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    campaignTargets(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          campaignID
          completedAt
          contactID
          createdAt
          createdBy
          email
          fullName
          groupID
          hasPendingWorkflow
          hasWorkflowHistory
          id
          metadata
          sentAt
          updatedAt
          updatedBy
          userID
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

export const CAMPAIGN_TARGET = gql`
  query CampaignTarget($campaignTargetId: ID!) {
    campaignTarget(id: $campaignTargetId) {
      campaignID
      completedAt
      contactID
      createdAt
      createdBy
      email
      fullName
      groupID
      hasPendingWorkflow
      hasWorkflowHistory
      id
      metadata
      sentAt
      updatedAt
      updatedBy
      userID
      workflowEligibleMarker
    }
  }
`

export const CREATE_CAMPAIGN_TARGET = gql`
  mutation CreateCampaignTarget($input: CreateCampaignTargetInput!) {
    createCampaignTarget(input: $input) {
      campaignTarget {
        id
      }
    }
  }
`

export const UPDATE_CAMPAIGN_TARGET = gql`
  mutation UpdateCampaignTarget($updateCampaignTargetId: ID!, $input: UpdateCampaignTargetInput!) {
    updateCampaignTarget(id: $updateCampaignTargetId, input: $input) {
      campaignTarget {
        id
      }
    }
  }
`

export const DELETE_CAMPAIGN_TARGET = gql`
  mutation DeleteCampaignTarget($deleteCampaignTargetId: ID!) {
    deleteCampaignTarget(id: $deleteCampaignTargetId) {
      deletedID
    }
  }
`

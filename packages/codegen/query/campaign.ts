import { gql } from 'graphql-request'

export const GET_ALL_CAMPAIGNS = gql`
  query CampaignsWithFilter($where: CampaignWhereInput, $orderBy: [CampaignOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    campaigns(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          assessmentID
          completedAt
          createdAt
          createdBy
          description
          displayID
          dueDate
          emailBrandingID
          emailTemplateID
          entityID
          hasPendingWorkflow
          hasWorkflowHistory
          id
          internalOwner
          internalOwnerGroupID
          internalOwnerUserID
          isActive
          isRecurring
          lastResentAt
          lastRunAt
          launchedAt
          metadata
          name
          nextRunAt
          recipientCount
          recurrenceCron
          recurrenceEndAt
          recurrenceInterval
          recurrenceTimezone
          resendCount
          scheduledAt
          templateID
          updatedAt
          updatedBy
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

export const CAMPAIGN = gql`
  query Campaign($campaignId: ID!) {
    campaign(id: $campaignId) {
      assessmentID
      completedAt
      createdAt
      createdBy
      description
      displayID
      dueDate
      emailBrandingID
      emailTemplateID
      entityID
      hasPendingWorkflow
      hasWorkflowHistory
      id
      internalOwner
      internalOwnerGroupID
      internalOwnerUserID
      isActive
      isRecurring
      lastResentAt
      lastRunAt
      launchedAt
      metadata
      name
      nextRunAt
      recipientCount
      recurrenceCron
      recurrenceEndAt
      recurrenceInterval
      recurrenceTimezone
      resendCount
      scheduledAt
      templateID
      updatedAt
      updatedBy
      workflowEligibleMarker
    }
  }
`

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createCampaign(input: $input) {
      campaign {
        id
      }
    }
  }
`

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($updateCampaignId: ID!, $input: UpdateCampaignInput!) {
    updateCampaign(id: $updateCampaignId, input: $input) {
      campaign {
        id
      }
    }
  }
`

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($deleteCampaignId: ID!) {
    deleteCampaign(id: $deleteCampaignId) {
      deletedID
    }
  }
`

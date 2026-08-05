import { gql } from 'graphql-request'

export const GET_ALL_CAMPAIGNS = gql`
  query CampaignsWithFilter($where: CampaignWhereInput, $orderBy: [CampaignOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    campaigns(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          assessmentID
          campaignType
          completedAt
          createdAt
          createdBy
          description
          displayID
          dueDate
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
          recurrenceFrequency
          recurrenceInterval
          recurrenceTimezone
          resendCount
          scheduledAt
          status
          tags
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

export const GET_CAMPAIGN_BY_ID_MINIFIED = gql`
  query GetCampaignByIdMinified($campaignId: ID!) {
    campaign(id: $campaignId) {
      id
      name
    }
  }
`

export const CAMPAIGN = gql`
  query Campaign($campaignId: ID!) {
    campaign(id: $campaignId) {
      assessmentID
      campaignType
      completedAt
      createdAt
      createdBy
      description
      displayID
      dueDate
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
      recurrenceFrequency
      recurrenceInterval
      recurrenceTimezone
      resendCount
      scheduledAt
      status
      tags
      template {
        id
        name
        description
        updatedAt
        jsonconfig
      }
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

export const CREATE_CAMPAIGN_WITH_TARGETS = gql`
  mutation CreateCampaignWithTargets($input: CreateCampaignWithTargetsInput!) {
    createCampaignWithTargets(input: $input) {
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

export const LAUNCH_CAMPAIGN = gql`
  mutation LaunchCampaign($input: LaunchCampaignInput!) {
    launchCampaign(input: $input) {
      queuedCount
      skippedCount
      campaign {
        id
        status
        launchedAt
        scheduledAt
      }
    }
  }
`

export const GET_CAMPAIGN_SUMMARY = gql`
  fragment UpcomingCampaignFields on Campaign {
    id
    name
    campaignType
    recipientCount
    scheduledAt
    nextRunAt
  }

  query CampaignSummary(
    $activeWhere: CampaignWhereInput
    $needsAttentionWhere: CampaignWhereInput
    $overdueWhere: CampaignWhereInput
    $scheduledOverdueWhere: CampaignWhereInput
    $completedRecentlyWhere: CampaignWhereInput
    $upcomingScheduledWhere: CampaignWhereInput
    $upcomingRecurringWhere: CampaignWhereInput
    $activeFirst: Int!
    $upcomingFirst: Int!
  ) {
    allCampaigns: campaigns {
      totalCount
    }
    activeCampaigns: campaigns(where: $activeWhere, first: $activeFirst) {
      totalCount
      edges {
        node {
          id
          recipientCount
        }
      }
    }
    needsAttentionCampaigns: campaigns(where: $needsAttentionWhere) {
      totalCount
    }
    overdueCampaigns: campaigns(where: $overdueWhere) {
      totalCount
    }
    scheduledOverdueCampaigns: campaigns(where: $scheduledOverdueWhere) {
      totalCount
    }
    completedRecentlyCampaigns: campaigns(where: $completedRecentlyWhere) {
      totalCount
    }
    upcomingScheduledCampaigns: campaigns(where: $upcomingScheduledWhere, orderBy: [{ field: scheduled_at, direction: ASC }], first: $upcomingFirst) {
      edges {
        node {
          ...UpcomingCampaignFields
        }
      }
    }
    upcomingRecurringCampaigns: campaigns(where: $upcomingRecurringWhere, orderBy: [{ field: next_run_at, direction: ASC }], first: $upcomingFirst) {
      edges {
        node {
          ...UpcomingCampaignFields
        }
      }
    }
  }
`

export const SEND_CAMPAIGN_TEST_EMAIL = gql`
  mutation SendCampaignTestEmail($input: SendCampaignTestEmailInput!) {
    sendCampaignTestEmail(input: $input) {
      queuedCount
      skippedCount
    }
  }
`

export const RESEND_CAMPAIGN_INCOMPLETE_TARGETS = gql`
  mutation ResendCampaignIncompleteTargets($input: ResendCampaignIncompleteInput!) {
    resendCampaignIncompleteTargets(input: $input) {
      queuedCount
      skippedCount
    }
  }
`

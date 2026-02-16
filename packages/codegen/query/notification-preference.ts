import { gql } from 'graphql-request'

export const GET_ALL_NOTIFICATION_PREFERENCES = gql`
  query NotificationPreferencesWithFilter($where: NotificationPreferenceWhereInput, $orderBy: [NotificationPreferenceOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    notificationPreferences(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          config
          createdAt
          createdBy
          destination
          enabled
          id
          isDefault
          lastError
          lastUsedAt
          metadata
          muteUntil
          provider
          quietHoursEnd
          quietHoursStart
          templateID
          timezone
          topicOverrides
          updatedAt
          updatedBy
          userID
          verifiedAt
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

export const NOTIFICATION_PREFERENCE = gql`
  query NotificationPreference($notificationPreferenceId: ID!) {
    notificationPreference(id: $notificationPreferenceId) {
      config
      createdAt
      createdBy
      destination
      enabled
      id
      isDefault
      lastError
      lastUsedAt
      metadata
      muteUntil
      provider
      quietHoursEnd
      quietHoursStart
      templateID
      timezone
      topicOverrides
      updatedAt
      updatedBy
      userID
      verifiedAt
    }
  }
`

export const CREATE_NOTIFICATION_PREFERENCE = gql`
  mutation CreateNotificationPreference($input: CreateNotificationPreferenceInput!) {
    createNotificationPreference(input: $input) {
      notificationPreference {
        id
      }
    }
  }
`

export const UPDATE_NOTIFICATION_PREFERENCE = gql`
  mutation UpdateNotificationPreference($updateNotificationPreferenceId: ID!, $input: UpdateNotificationPreferenceInput!) {
    updateNotificationPreference(id: $updateNotificationPreferenceId, input: $input) {
      notificationPreference {
        id
      }
    }
  }
`

export const DELETE_NOTIFICATION_PREFERENCE = gql`
  mutation DeleteNotificationPreference($deleteNotificationPreferenceId: ID!) {
    deleteNotificationPreference(id: $deleteNotificationPreferenceId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_NOTIFICATION_PREFERENCE = gql`
  mutation CreateBulkCSVNotificationPreference($input: Upload!) {
    createBulkCSVNotificationPreference(input: $input) {
      notificationPreferences {
        id
      }
    }
  }
`

export const BULK_DELETE_NOTIFICATION_PREFERENCE = gql`
  mutation DeleteBulkNotificationPreference($ids: [ID!]!) {
    deleteBulkNotificationPreference(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_NOTIFICATION_PREFERENCE = gql`
  mutation UpdateBulkNotificationPreference($ids: [ID!]!, $input: UpdateNotificationPreferenceInput!) {
    updateBulkNotificationPreference(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

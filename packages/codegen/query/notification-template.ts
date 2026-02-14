import { gql } from 'graphql-request'

export const GET_ALL_NOTIFICATION_TEMPLATES = gql`
  query NotificationTemplatesWithFilter($where: NotificationTemplateWhereInput, $orderBy: [NotificationTemplateOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    notificationTemplates(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          active
          blocks
          bodyTemplate
          createdAt
          createdBy
          description
          emailTemplateID
          id
          integrationID
          jsonconfig
          key
          locale
          metadata
          name
          subjectTemplate
          systemOwned
          titleTemplate
          topicPattern
          uischema
          updatedAt
          updatedBy
          version
          workflowDefinitionID
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

export const NOTIFICATION_TEMPLATE = gql`
  query NotificationTemplate($notificationTemplateId: ID!) {
    notificationTemplate(id: $notificationTemplateId) {
      active
      blocks
      bodyTemplate
      createdAt
      createdBy
      description
      emailTemplateID
      id
      integrationID
      jsonconfig
      key
      locale
      metadata
      name
      subjectTemplate
      systemOwned
      titleTemplate
      topicPattern
      uischema
      updatedAt
      updatedBy
      version
      workflowDefinitionID
    }
  }
`

export const CREATE_NOTIFICATION_TEMPLATE = gql`
  mutation CreateNotificationTemplate($input: CreateNotificationTemplateInput!) {
    createNotificationTemplate(input: $input) {
      notificationTemplate {
        id
      }
    }
  }
`

export const UPDATE_NOTIFICATION_TEMPLATE = gql`
  mutation UpdateNotificationTemplate($updateNotificationTemplateId: ID!, $input: UpdateNotificationTemplateInput!) {
    updateNotificationTemplate(id: $updateNotificationTemplateId, input: $input) {
      notificationTemplate {
        id
      }
    }
  }
`

export const DELETE_NOTIFICATION_TEMPLATE = gql`
  mutation DeleteNotificationTemplate($deleteNotificationTemplateId: ID!) {
    deleteNotificationTemplate(id: $deleteNotificationTemplateId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_NOTIFICATION_TEMPLATE = gql`
  mutation CreateBulkCSVNotificationTemplate($input: Upload!) {
    createBulkCSVNotificationTemplate(input: $input) {
      notificationTemplates {
        id
      }
    }
  }
`

export const BULK_DELETE_NOTIFICATION_TEMPLATE = gql`
  mutation DeleteBulkNotificationTemplate($ids: [ID!]!) {
    deleteBulkNotificationTemplate(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_NOTIFICATION_TEMPLATE = gql`
  mutation UpdateBulkNotificationTemplate($ids: [ID!]!, $input: UpdateNotificationTemplateInput!) {
    updateBulkNotificationTemplate(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_EMAIL_TEMPLATES = gql`
  query EmailTemplatesWithFilter($where: EmailTemplateWhereInput, $orderBy: [EmailTemplateOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    emailTemplates(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          active
          bodyTemplate
          createdAt
          createdBy
          description
          emailBrandingID
          id
          integrationID
          jsonconfig
          key
          locale
          metadata
          name
          preheaderTemplate
          subjectTemplate
          systemOwned
          textTemplate
          uischema
          updatedAt
          updatedBy
          version
          workflowDefinitionID
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

export const EMAIL_TEMPLATE = gql`
  query EmailTemplate($emailTemplateId: ID!) {
    emailTemplate(id: $emailTemplateId) {
      active
      bodyTemplate
      createdAt
      createdBy
      description
      emailBrandingID
      id
      integrationID
      jsonconfig
      key
      locale
      metadata
      name
      preheaderTemplate
      subjectTemplate
      systemOwned
      textTemplate
      uischema
      updatedAt
      updatedBy
      version
      workflowDefinitionID
      workflowInstanceID
    }
  }
`

export const CREATE_EMAIL_TEMPLATE = gql`
  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {
    createEmailTemplate(input: $input) {
      emailTemplate {
        id
      }
    }
  }
`

export const UPDATE_EMAIL_TEMPLATE = gql`
  mutation UpdateEmailTemplate($updateEmailTemplateId: ID!, $input: UpdateEmailTemplateInput!) {
    updateEmailTemplate(id: $updateEmailTemplateId, input: $input) {
      emailTemplate {
        id
      }
    }
  }
`

export const DELETE_EMAIL_TEMPLATE = gql`
  mutation DeleteEmailTemplate($deleteEmailTemplateId: ID!) {
    deleteEmailTemplate(id: $deleteEmailTemplateId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_EMAIL_TEMPLATE = gql`
  mutation CreateBulkCSVEmailTemplate($input: Upload!) {
    createBulkCSVEmailTemplate(input: $input) {
      emailTemplates {
        id
      }
    }
  }
`

export const BULK_DELETE_EMAIL_TEMPLATE = gql`
  mutation DeleteBulkEmailTemplate($ids: [ID!]!) {
    deleteBulkEmailTemplate(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_EMAIL_TEMPLATE = gql`
  mutation UpdateBulkEmailTemplate($ids: [ID!]!, $input: UpdateEmailTemplateInput!) {
    updateBulkEmailTemplate(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

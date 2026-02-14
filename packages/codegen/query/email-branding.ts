import { gql } from 'graphql-request'

export const GET_ALL_EMAIL_BRANDINGS = gql`
  query EmailBrandingsWithFilter($where: EmailBrandingWhereInput, $orderBy: [EmailBrandingOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    emailBrandings(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          backgroundColor
          brandName
          buttonColor
          buttonTextColor
          createdAt
          createdBy
          id
          isDefault
          linkColor
          logoRemoteURL
          name
          primaryColor
          secondaryColor
          textColor
          updatedAt
          updatedBy
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

export const EMAIL_BRANDING = gql`
  query EmailBranding($emailBrandingId: ID!) {
    emailBranding(id: $emailBrandingId) {
      backgroundColor
      brandName
      buttonColor
      buttonTextColor
      createdAt
      createdBy
      id
      isDefault
      linkColor
      logoRemoteURL
      name
      primaryColor
      secondaryColor
      textColor
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_EMAIL_BRANDING = gql`
  mutation CreateEmailBranding($input: CreateEmailBrandingInput!) {
    createEmailBranding(input: $input) {
      emailBranding {
        id
      }
    }
  }
`

export const UPDATE_EMAIL_BRANDING = gql`
  mutation UpdateEmailBranding($updateEmailBrandingId: ID!, $input: UpdateEmailBrandingInput!) {
    updateEmailBranding(id: $updateEmailBrandingId, input: $input) {
      emailBranding {
        id
      }
    }
  }
`

export const DELETE_EMAIL_BRANDING = gql`
  mutation DeleteEmailBranding($deleteEmailBrandingId: ID!) {
    deleteEmailBranding(id: $deleteEmailBrandingId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_EMAIL_BRANDING = gql`
  mutation CreateBulkCSVEmailBranding($input: Upload!) {
    createBulkCSVEmailBranding(input: $input) {
      emailBrandings {
        id
      }
    }
  }
`

export const BULK_DELETE_EMAIL_BRANDING = gql`
  mutation DeleteBulkEmailBranding($ids: [ID!]!) {
    deleteBulkEmailBranding(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_EMAIL_BRANDING = gql`
  mutation UpdateBulkEmailBranding($ids: [ID!]!, $input: UpdateEmailBrandingInput!) {
    updateBulkEmailBranding(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

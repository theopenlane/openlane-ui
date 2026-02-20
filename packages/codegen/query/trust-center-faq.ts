import { gql } from 'graphql-request'

export const GET_ALL_TRUST_CENTER_FAQS = gql`
  query TrustCenterFAQsWithFilter($where: TrustCenterFAQWhereInput, $orderBy: [TrustCenterFAQOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    trustCenterFAQs(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          displayOrder
          id
          noteID
          referenceLink
          trustCenterFaqKindID
          trustCenterFaqKindName
          trustCenterID
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

export const TRUST_CENTER_FAQ = gql`
  query TrustCenterFAQ($trustCenterFAQId: ID!) {
    trustCenterFAQ(id: $trustCenterFAQId) {
      createdAt
      createdBy
      displayOrder
      id
      noteID
      referenceLink
      trustCenterFaqKindID
      trustCenterFaqKindName
      trustCenterID
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_TRUST_CENTER_FAQ = gql`
  mutation CreateTrustCenterFAQ($input: CreateTrustCenterFAQInput!) {
    createTrustCenterFAQ(input: $input) {
      trustCenterFAQ {
        id
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_FAQ = gql`
  mutation UpdateTrustCenterFAQ($updateTrustCenterFAQId: ID!, $input: UpdateTrustCenterFAQInput!) {
    updateTrustCenterFAQ(id: $updateTrustCenterFAQId, input: $input) {
      trustCenterFAQ {
        id
      }
    }
  }
`

export const DELETE_TRUST_CENTER_FAQ = gql`
  mutation DeleteTrustCenterFAQ($deleteTrustCenterFAQId: ID!) {
    deleteTrustCenterFAQ(id: $deleteTrustCenterFAQId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_TRUST_CENTER_FAQ = gql`
  mutation CreateBulkCSVTrustCenterFAQ($input: Upload!) {
    createBulkCSVTrustCenterFAQ(input: $input) {
      trustCenterFAQs {
        id
      }
    }
  }
`

export const BULK_DELETE_TRUST_CENTER_FAQ = gql`
  mutation DeleteBulkTrustCenterFAQ($ids: [ID!]!) {
    deleteBulkTrustCenterFAQ(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_TRUST_CENTER_FAQ = gql`
  mutation UpdateBulkTrustCenterFAQ($ids: [ID!]!, $input: UpdateTrustCenterFAQInput!) {
    updateBulkTrustCenterFAQ(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

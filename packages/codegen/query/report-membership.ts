import { gql } from 'graphql-request'

export const GET_ALL_REPORT_MEMBERSHIPS = gql`
  query ReportMembershipsWithFilter($where: ReportMembershipWhereInput, $orderBy: [ReportMembershipOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    reportMemberships(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          id
          reportID
          updatedAt
          updatedBy
          updatedByImpersonator
          userID
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

export const REPORT_MEMBERSHIP = gql`
  query ReportMembership($reportMembershipId: ID!) {
    reportMembership(id: $reportMembershipId) {
      createdAt
      createdBy
      id
      reportID
      updatedAt
      updatedBy
      updatedByImpersonator
      userID
    }
  }
`

export const CREATE_REPORT_MEMBERSHIP = gql`
  mutation CreateReportMembership($input: CreateReportMembershipInput!) {
    createReportMembership(input: $input) {
      reportMembership {
        id
      }
    }
  }
`

export const UPDATE_REPORT_MEMBERSHIP = gql`
  mutation UpdateReportMembership($updateReportMembershipId: ID!, $input: UpdateReportMembershipInput!) {
    updateReportMembership(id: $updateReportMembershipId, input: $input) {
      reportMembership {
        id
      }
    }
  }
`

export const DELETE_REPORT_MEMBERSHIP = gql`
  mutation DeleteReportMembership($deleteReportMembershipId: ID!) {
    deleteReportMembership(id: $deleteReportMembershipId) {
      deletedID
    }
  }
`

export const BULK_DELETE_REPORT_MEMBERSHIP = gql`
  mutation DeleteBulkReportMembership($ids: [ID!]!) {
    deleteBulkReportMembership(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_REPORT_MEMBERSHIP = gql`
  mutation UpdateBulkReportMembership($ids: [ID!]!, $input: UpdateReportMembershipInput!) {
    updateBulkReportMembership(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

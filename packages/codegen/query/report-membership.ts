import { gql } from 'graphql-request'

export const GET_REPORT_MEMBERS = gql`
  query GetReportMembers($reportId: ID!, $first: Int, $after: Cursor) {
    report(id: $reportId) {
      id
      members(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            role
            userID
            user {
              id
              displayName
              email
            }
          }
        }
      }
    }
  }
`

export const CREATE_BULK_REPORT_MEMBERSHIP = gql`
  mutation CreateBulkReportMembership($input: [CreateReportMembershipInput!]) {
    createBulkReportMembership(input: $input) {
      reportMemberships {
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

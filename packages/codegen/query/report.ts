import { gql } from 'graphql-request'

export const GET_ALL_REPORTS = gql`
  query GetAllReports($where: ReportWhereInput, $first: Int, $last: Int, $after: Cursor, $before: Cursor, $orderBy: [ReportOrder!]) {
    reports(where: $where, first: $first, last: $last, after: $after, before: $before, orderBy: $orderBy) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        node {
          id
          name
          visibility
          variables
          updatedAt
          reportOwnerID
          createdBy
        }
      }
    }
  }
`

export const GET_REPORT = gql`
  query GetReport($reportId: ID!) {
    report(id: $reportId) {
      id
      name
      query
      variables
      visibility
    }
  }
`

export const GET_REPORT_VIEWER_GROUPS = gql`
  query GetReportViewerGroups($reportId: ID!, $first: Int, $after: Cursor) {
    report(id: $reportId) {
      id
      viewers(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            name
            displayName
          }
        }
      }
    }
  }
`

export const CREATE_REPORT = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) {
      report {
        id
      }
    }
  }
`

export const UPDATE_REPORT = gql`
  mutation UpdateReport($updateReportId: ID!, $input: UpdateReportInput!) {
    updateReport(id: $updateReportId, input: $input) {
      report {
        id
      }
    }
  }
`

export const DELETE_REPORT = gql`
  mutation DeleteReport($deleteReportId: ID!) {
    deleteReport(id: $deleteReportId) {
      deletedID
    }
  }
`

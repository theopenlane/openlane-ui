import { gql } from 'graphql-request'

export const GET_ALL_REPORTS = gql`
  query ReportsWithFilter($where: ReportWhereInput, $orderBy: [ReportOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    reports(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          displayID
          id
          name
          query
          reportKindID
          reportKindName
          reportOwnerID
          requestorID
          updatedAt
          updatedBy
          updatedByImpersonator
          variables
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

export const REPORT = gql`
  query Report($reportId: ID!) {
    report(id: $reportId) {
      createdAt
      createdBy
      displayID
      id
      name
      query
      reportKindID
      reportKindName
      reportOwnerID
      requestorID
      updatedAt
      updatedBy
      updatedByImpersonator
      variables
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

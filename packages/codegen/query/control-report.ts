import { gql } from 'graphql-request'

export const GET_ALL_CONTROL_REPORTS = gql`
  query ControlReportsWithFilter($where: ControlReportWhereInput, $orderBy: [ControlReportOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controlReports(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          category
          description
          id
          refCode
          referenceFramework
          subcategory
          title
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

export const CONTROL_REPORT = gql`
  query ControlReport($controlReportId: ID!) {
    controlReport(id: $controlReportId) {
      category
      description
      id
      refCode
      referenceFramework
      subcategory
      title
    }
  }
`

export const CREATE_CONTROL_REPORT = gql`
  mutation CreateControlReport($input: CreateControlReportInput!) {
    createControlReport(input: $input) {
      controlReport {
        id
      }
    }
  }
`

export const UPDATE_CONTROL_REPORT = gql`
  mutation UpdateControlReport($updateControlReportId: ID!, $input: UpdateControlReportInput!) {
    updateControlReport(id: $updateControlReportId, input: $input) {
      controlReport {
        id
      }
    }
  }
`

export const DELETE_CONTROL_REPORT = gql`
  mutation DeleteControlReport($deleteControlReportId: ID!) {
    deleteControlReport(id: $deleteControlReportId) {
      deletedID
    }
  }
`

export const BULK_DELETE_CONTROL_REPORT = gql`
  mutation DeleteBulkControlReport($ids: [ID!]!) {
    deleteBulkControlReport(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_CONTROL_REPORT = gql`
  mutation UpdateBulkControlReport($ids: [ID!]!, $input: UpdateControlReportInput!) {
    updateBulkControlReport(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_SCANS = gql`
  query ScansWithFilter($where: ScanWhereInput, $orderBy: [ScanOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    scans(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          assignedTo
          assignedToGroupID
          assignedToUserID
          createdAt
          createdBy
          environmentID
          environmentName
          generatedByPlatformID
          id
          metadata
          nextScanRunAt
          performedBy
          performedByGroupID
          performedByUserID
          reviewedBy
          reviewedByGroupID
          reviewedByUserID
          scanDate
          scanSchedule
          scopeID
          scopeName
          target
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

export const SCAN = gql`
  query Scan($scanId: ID!) {
    scan(id: $scanId) {
      assignedTo
      assignedToGroupID
      assignedToUserID
      createdAt
      createdBy
      environmentID
      environmentName
      generatedByPlatformID
      id
      metadata
      nextScanRunAt
      performedBy
      performedByGroupID
      performedByUserID
      reviewedBy
      reviewedByGroupID
      reviewedByUserID
      scanDate
      scanSchedule
      scopeID
      scopeName
      target
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_SCAN = gql`
  mutation CreateScan($input: CreateScanInput!) {
    createScan(input: $input) {
      scan {
        id
      }
    }
  }
`

export const UPDATE_SCAN = gql`
  mutation UpdateScan($updateScanId: ID!, $input: UpdateScanInput!) {
    updateScan(id: $updateScanId, input: $input) {
      scan {
        id
      }
    }
  }
`

export const DELETE_SCAN = gql`
  mutation DeleteScan($deleteScanId: ID!) {
    deleteScan(id: $deleteScanId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_SCAN = gql`
  mutation CreateBulkCSVScan($input: Upload!) {
    createBulkCSVScan(input: $input) {
      scans {
        id
      }
    }
  }
`

export const BULK_DELETE_SCAN = gql`
  mutation DeleteBulkScan($ids: [ID!]!) {
    deleteBulkScan(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_SCAN = gql`
  mutation UpdateBulkScan($ids: [ID!]!, $input: UpdateScanInput!) {
    updateBulkScan(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

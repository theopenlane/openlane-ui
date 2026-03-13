import { gql } from 'graphql-request'

export const GET_ALL_SCANS = gql`
  query ScansWithFilter($where: ScanWhereInput, $orderBy: [ScanOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    scans(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          assignedTo
          assignedToUser {
            id
            displayName
          }
          assignedToGroup {
            id
            displayName
          }
          createdAt
          createdBy
          environmentID
          environmentName
          generatedByPlatformID
          id
          metadata
          nextScanRunAt
          performedBy
          performedByUser {
            id
            displayName
          }
          performedByGroup {
            id
            displayName
          }
          reviewedBy
          reviewedByUser {
            id
            displayName
          }
          reviewedByGroup {
            id
            displayName
          }
          scanDate
          scanSchedule
          scanType
          scopeID
          scopeName
          status
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
      assignedToUser {
        id
        displayName
      }
      assignedToGroup {
        id
        displayName
      }
      createdAt
      createdBy
      environmentID
      environmentName
      generatedByPlatformID
      id
      metadata
      nextScanRunAt
      performedBy
      performedByUser {
        id
        displayName
      }
      performedByGroup {
        id
        displayName
      }
      reviewedBy
      reviewedByUser {
        id
        displayName
      }
      reviewedByGroup {
        id
        displayName
      }
      scanDate
      scanSchedule
      scanType
      scopeID
      scopeName
      status
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

export const GET_SCAN_ASSOCIATIONS = gql`
  query GetScanAssociations($scanId: ID!) {
    scan(id: $scanId) {
      controls {
        totalCount
        edges {
          node {
            id
            refCode
            description
            displayID
          }
        }
      }
      assets {
        totalCount
        edges {
          node {
            id
            name
            displayName
          }
        }
      }
      remediations {
        totalCount
        edges {
          node {
            id
            title
            displayID
          }
        }
      }
      tasks {
        totalCount
        edges {
          node {
            id
            title
            displayID
          }
        }
      }
      vulnerabilities {
        totalCount
        edges {
          node {
            id
            displayName
            displayID
          }
        }
      }
    }
  }
`

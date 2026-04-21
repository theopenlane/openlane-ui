import { gql } from 'graphql-request'

export const GET_ALL_VENDOR_SCORING_CONFIGS = gql`
  query VendorScoringConfigsWithFilter($where: VendorScoringConfigWhereInput, $orderBy: [VendorScoringConfigOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    vendorScoringConfigs(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          id
          questions
          riskThresholds
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

export const VENDOR_SCORING_CONFIG = gql`
  query VendorScoringConfig($vendorScoringConfigId: ID!) {
    vendorScoringConfig(id: $vendorScoringConfigId) {
      createdAt
      createdBy
      id
      questions
      riskThresholds
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_VENDOR_SCORING_CONFIG = gql`
  mutation CreateVendorScoringConfig($input: CreateVendorScoringConfigInput!) {
    createVendorScoringConfig(input: $input) {
      vendorScoringConfig {
        id
      }
    }
  }
`

export const UPDATE_VENDOR_SCORING_CONFIG = gql`
  mutation UpdateVendorScoringConfig($updateVendorScoringConfigId: ID!, $input: UpdateVendorScoringConfigInput!) {
    updateVendorScoringConfig(id: $updateVendorScoringConfigId, input: $input) {
      vendorScoringConfig {
        id
      }
    }
  }
`

export const DELETE_VENDOR_SCORING_CONFIG = gql`
  mutation DeleteVendorScoringConfig($deleteVendorScoringConfigId: ID!) {
    deleteVendorScoringConfig(id: $deleteVendorScoringConfigId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_VENDOR_SCORING_CONFIG = gql`
  mutation CreateBulkCSVVendorScoringConfig($input: Upload!) {
    createBulkCSVVendorScoringConfig(input: $input) {
      vendorScoringConfigs {
        id
      }
    }
  }
`

export const BULK_DELETE_VENDOR_SCORING_CONFIG = gql`
  mutation DeleteBulkVendorScoringConfig($ids: [ID!]!) {
    deleteBulkVendorScoringConfig(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_VENDOR_SCORING_CONFIG = gql`
  mutation UpdateBulkVendorScoringConfig($ids: [ID!]!, $input: UpdateVendorScoringConfigInput!) {
    updateBulkVendorScoringConfig(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_VENDOR_RISK_SCORES = gql`
  query VendorRiskScoresWithFilter($where: VendorRiskScoreWhereInput, $orderBy: [VendorRiskScoreOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    vendorRiskScores(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          answer
          assessmentResponseID
          createdAt
          createdBy
          entityID
          id
          notes
          questionDescription
          questionKey
          questionName
          score
          updatedAt
          updatedBy
          vendorScoringConfigID
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

export const VENDOR_RISK_SCORE = gql`
  query VendorRiskScore($vendorRiskScoreId: ID!) {
    vendorRiskScore(id: $vendorRiskScoreId) {
      answer
      assessmentResponseID
      createdAt
      createdBy
      entityID
      id
      notes
      questionDescription
      questionKey
      questionName
      score
      updatedAt
      updatedBy
      vendorScoringConfigID
    }
  }
`

export const CREATE_VENDOR_RISK_SCORE = gql`
  mutation CreateVendorRiskScore($input: CreateVendorRiskScoreInput!) {
    createVendorRiskScore(input: $input) {
      vendorRiskScore {
        id
      }
    }
  }
`

export const UPDATE_VENDOR_RISK_SCORE = gql`
  mutation UpdateVendorRiskScore($updateVendorRiskScoreId: ID!, $input: UpdateVendorRiskScoreInput!) {
    updateVendorRiskScore(id: $updateVendorRiskScoreId, input: $input) {
      vendorRiskScore {
        id
      }
    }
  }
`

export const DELETE_VENDOR_RISK_SCORE = gql`
  mutation DeleteVendorRiskScore($deleteVendorRiskScoreId: ID!) {
    deleteVendorRiskScore(id: $deleteVendorRiskScoreId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_VENDOR_RISK_SCORE = gql`
  mutation CreateBulkCSVVendorRiskScore($input: Upload!) {
    createBulkCSVVendorRiskScore(input: $input) {
      vendorRiskScores {
        id
      }
    }
  }
`

export const BULK_DELETE_VENDOR_RISK_SCORE = gql`
  mutation DeleteBulkVendorRiskScore($ids: [ID!]!) {
    deleteBulkVendorRiskScore(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_VENDOR_RISK_SCORE = gql`
  mutation UpdateBulkVendorRiskScore($ids: [ID!]!, $input: UpdateVendorRiskScoreInput!) {
    updateBulkVendorRiskScore(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

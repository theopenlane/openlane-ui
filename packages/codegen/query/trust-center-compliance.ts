import { gql } from 'graphql-request'

export const GET_ALL_TRUST_CENTER_COMPLIANCES = gql`
  query GetTrustCenterCompliances {
    trustCenterCompliances {
      edges {
        node {
          id
          standard {
            id
            shortName
            description
            tags
            systemOwned
          }
        }
      }
    }
  }
`

export const CREATE_BULK_TRUST_CENTER_COMPLIANCE = gql`
  mutation CreateBulkTrustCenterCompliance($input: [CreateTrustCenterComplianceInput!]) {
    createBulkTrustCenterCompliance(input: $input) {
      trustCenterCompliances {
        id
      }
    }
  }
`

export const DELETE_BULK_TRUST_CENTER_COMPLIANCE = gql`
  mutation DeleteBulkTrustCenterCompliance($ids: [ID!]!) {
    deleteBulkTrustCenterCompliance(ids: $ids) {
      deletedIDs
    }
  }
`

export const UPDATE_TRUST_CENTER_COMPLIANCE = gql`
  mutation UpdateTrustCenterCompliance($updateTrustCenterComplianceId: ID!, $input: UpdateTrustCenterComplianceInput!) {
    updateTrustCenterCompliance(id: $updateTrustCenterComplianceId, input: $input) {
      trustCenterCompliance {
        id
      }
    }
  }
`

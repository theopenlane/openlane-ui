import { gql } from 'graphql-request'

export const GET_TRUST_CENTER_COMPLIANCES = gql`
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

export const CREATE_TRUST_CENTER_COMPLIANCE = gql`
  mutation CreateTrustCenterCompliance($input: CreateTrustCenterComplianceInput!) {
    createTrustCenterCompliance(input: $input) {
      trustCenterCompliance {
        id
      }
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

export const DELETE_TRUST_CENTER_COMPLIANCE = gql`
  mutation DeleteTrustCenterCompliance($deleteTrustCenterComplianceId: ID!) {
    deleteTrustCenterCompliance(id: $deleteTrustCenterComplianceId) {
      deletedID
    }
  }
`

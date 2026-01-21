import { gql } from 'graphql-request'

export const GET_TRUST_CENTER_NDA_REQUESTS = gql`
  query GetTrustCenterNDARequests {
    trustCenterNdaRequests {
      edges {
        node {
          updatedAt
          id
        }
      }
    }
  }
`

export const CREATE_TRUST_CENTER_NDA = gql`
  mutation CreateTrustCenterNDA($input: CreateTrustCenterNDAInput!, $templateFiles: [Upload!]) {
    createTrustCenterNDA(input: $input, templateFiles: $templateFiles) {
      template {
        id
      }
    }
  }
`

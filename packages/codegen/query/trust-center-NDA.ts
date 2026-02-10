import { gql } from 'graphql-request'

export const GET_TRUST_CENTER_NDA_FILES = gql`
  query GetTrustCenterNDAFiles($where: TemplateWhereInput) {
    templates(where: $where) {
      edges {
        node {
          id
          updatedAt
          files {
            edges {
              node {
                providedFileName
                id
                presignedURL
                updatedAt
              }
            }
          }
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

export const UPDATE_TRUST_CENTER_NDA = gql`
  mutation UpdateTrustCenterNDA($updateTrustCenterNdaId: ID!, $templateFiles: [Upload!]) {
    updateTrustCenterNDA(id: $updateTrustCenterNdaId, templateFiles: $templateFiles) {
      template {
        id
      }
    }
  }
`

export const GET_NDA_REQUESTS_COUNT = gql`
  query GetNDARequestCount($where: TrustCenterNDARequestWhereInput) {
    trustCenterNdaRequests(where: $where) {
      totalCount
    }
  }
`

export const GET_TRUST_CENTER_NDA_REQUESTS = gql`
  query GetTrustCenterNDARequests($after: Cursor, $first: Int, $before: Cursor, $last: Int, $orderBy: [TrustCenterNDARequestOrder!], $where: TrustCenterNDARequestWhereInput) {
    trustCenterNdaRequests(after: $after, first: $first, before: $before, last: $last, orderBy: $orderBy, where: $where) {
      totalCount
      pageInfo {
        endCursor
        startCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          firstName
          lastName
          companyName
          email
          createdAt
          approvedAt
          signedAt
          status
        }
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_NDA_REQUEST = gql`
  mutation UpdateTrustCenterNDARequest($updateTrustCenterNdaRequestId: ID!, $input: UpdateTrustCenterNDARequestInput!) {
    updateTrustCenterNDARequest(id: $updateTrustCenterNdaRequestId, input: $input) {
      trustCenterNDARequest {
        id
      }
    }
  }
`

export const DELETE_BULK_TRUST_CENTER_NDA_REQUEST = gql`
  mutation DeleteBulkTrustCenterNDARequest($ids: [ID!]!) {
    deleteBulkTrustCenterNDARequest(ids: $ids) {
      deletedIDs
    }
  }
`

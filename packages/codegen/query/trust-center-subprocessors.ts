import { gql } from 'graphql-request'

export const GET_TRUST_CENTER_SUBPROCESSORS = gql`
  query GetTrustCenterSubprocessors($where: TrustCenterSubprocessorWhereInput, $first: Int, $last: Int, $after: Cursor, $before: Cursor, $orderBy: [TrustCenterSubprocessorOrder!]) {
    trustCenterSubprocessors(where: $where, first: $first, last: $last, after: $after, before: $before, orderBy: $orderBy) {
      edges {
        node {
          id
          subprocessor {
            id
            name
            description
            logoRemoteURL
            systemOwned
            logoFile {
              presignedURL
              base64
            }
          }
          trustCenterSubprocessorKindName
          countries
          createdAt
          createdBy
          updatedAt
          updatedBy
        }
        cursor
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`

export const CREATE_TRUST_CENTER_SUBPROCESSOR = gql`
  mutation CreateTrustCenterSubprocessor($input: CreateTrustCenterSubprocessorInput!) {
    createTrustCenterSubprocessor(input: $input) {
      trustCenterSubprocessor {
        id
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_SUBPROCESSOR = gql`
  mutation UpdateTrustCenterSubprocessor($id: ID!, $input: UpdateTrustCenterSubprocessorInput!) {
    updateTrustCenterSubprocessor(id: $id, input: $input) {
      trustCenterSubprocessor {
        id
      }
    }
  }
`

export const DELETE_BULK_TRUST_CENTER_SUBPROCESSORS = gql`
  mutation DeleteBulkTrustCenterSubprocessors($ids: [ID!]!) {
    deleteBulkTrustCenterSubprocessor(ids: $ids) {
      deletedIDs
    }
  }
`

export const DELETE_TRUST_CENTER_SUBPROCESSOR = gql`
  mutation DeleteTrustCenterSubprocessor($deleteTrustCenterSubprocessorId: ID!) {
    deleteTrustCenterSubprocessor(id: $deleteTrustCenterSubprocessorId) {
      deletedID
    }
  }
`

export const GET_TRUST_CENTER_SUBPROCESSOR_BY_ID = gql`
  query GetTrustCenterSubprocessorByID($trustCenterSubprocessorId: ID!) {
    trustCenterSubprocessor(id: $trustCenterSubprocessorId) {
      id
      trustCenterSubprocessorKindName
      countries
      subprocessor {
        id
        name
        description
        logoRemoteURL
        systemOwned
        logoFile {
          presignedURL
          base64
        }
      }
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_SYSTEM_DETAILS = gql`
  query SystemDetailsWithFilter($where: SystemDetailWhereInput, $orderBy: [SystemDetailOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    systemDetails(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          authorizationBoundary
          createdAt
          createdBy
          description
          displayID
          id
          lastReviewed
          oscalMetadataJSON
          platform {
            id
            name
          }
          platformID
          program {
            id
            name
          }
          programID
          revisionHistory
          sensitivityLevel
          systemName
          tags
          updatedAt
          updatedBy
          version
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

export const SYSTEM_DETAIL = gql`
  query SystemDetail($systemDetailId: ID!) {
    systemDetail(id: $systemDetailId) {
      authorizationBoundary
      createdAt
      createdBy
      description
      displayID
      id
      lastReviewed
      oscalMetadataJSON
      platform {
        id
        name
      }
      platformID
      program {
        id
        name
      }
      programID
      revisionHistory
      sensitivityLevel
      systemName
      tags
      updatedAt
      updatedBy
      version
    }
  }
`

export const CREATE_SYSTEM_DETAIL = gql`
  mutation CreateSystemDetail($input: CreateSystemDetailInput!) {
    createSystemDetail(input: $input) {
      systemDetail {
        id
      }
    }
  }
`

export const UPDATE_SYSTEM_DETAIL = gql`
  mutation UpdateSystemDetail($updateSystemDetailId: ID!, $input: UpdateSystemDetailInput!) {
    updateSystemDetail(id: $updateSystemDetailId, input: $input) {
      systemDetail {
        id
      }
    }
  }
`

export const DELETE_SYSTEM_DETAIL = gql`
  mutation DeleteSystemDetail($deleteSystemDetailId: ID!) {
    deleteSystemDetail(id: $deleteSystemDetailId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_SYSTEM_DETAIL = gql`
  mutation CreateBulkCSVSystemDetail($input: Upload!) {
    createBulkCSVSystemDetail(input: $input) {
      systemDetails {
        id
      }
    }
  }
`

export const BULK_DELETE_SYSTEM_DETAIL = gql`
  mutation DeleteBulkSystemDetail($ids: [ID!]!) {
    deleteBulkSystemDetail(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_SYSTEM_DETAIL = gql`
  mutation UpdateBulkSystemDetail($ids: [ID!]!, $input: UpdateSystemDetailInput!) {
    updateBulkSystemDetail(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

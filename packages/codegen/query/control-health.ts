import { gql } from 'graphql-request'

export const GET_ALL_CONTROL_HEALTHS = gql`
  query ControlHealthsWithFilter($where: ControlHealthWhereInput, $orderBy: [ControlHealthOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controlHealths(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          checkStatus
          createdAt
          createdBy
          details
          externalURI
          id
          lastObservedAt
          source
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

export const CONTROL_HEALTH = gql`
  query ControlHealth($controlHealthId: ID!) {
    controlHealth(id: $controlHealthId) {
      createdAt
      createdBy
      details
      externalURI
      id
      lastObservedAt
      source
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_CONTROL_HEALTH = gql`
  mutation CreateControlHealth($input: CreateControlHealthInput!) {
    createControlHealth(input: $input) {
      controlHealth {
        id
      }
    }
  }
`

export const UPDATE_CONTROL_HEALTH = gql`
  mutation UpdateControlHealth($updateControlHealthId: ID!, $input: UpdateControlHealthInput!) {
    updateControlHealth(id: $updateControlHealthId, input: $input) {
      controlHealth {
        id
      }
    }
  }
`

export const DELETE_CONTROL_HEALTH = gql`
  mutation DeleteControlHealth($deleteControlHealthId: ID!) {
    deleteControlHealth(id: $deleteControlHealthId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_CONTROL_HEALTH = gql`
  mutation CreateBulkCSVControlHealth($input: Upload!) {
    createBulkCSVControlHealth(input: $input) {
      controlHealths {
        id
      }
    }
  }
`

export const BULK_DELETE_CONTROL_HEALTH = gql`
  mutation DeleteBulkControlHealth($ids: [ID!]!) {
    deleteBulkControlHealth(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_CONTROL_HEALTH = gql`
  mutation UpdateBulkControlHealth($ids: [ID!]!, $input: UpdateControlHealthInput!) {
    updateBulkControlHealth(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_ENTITY_TYPES = gql`
  query EntityTypesWithFilter($where: EntityTypeWhereInput, $orderBy: [EntityTypeOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    entityTypes(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          id
          name
          systemOwned
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

export const ENTITY_TYPE = gql`
  query EntityType($entityTypeId: ID!) {
    entityType(id: $entityTypeId) {
      createdAt
      createdBy
      id
      name
      systemOwned
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_ENTITY_TYPE = gql`
  mutation CreateEntityType($input: CreateEntityTypeInput!) {
    createEntityType(input: $input) {
      entityType {
        id
      }
    }
  }
`

export const UPDATE_ENTITY_TYPE = gql`
  mutation UpdateEntityType($updateEntityTypeId: ID!, $input: UpdateEntityTypeInput!) {
    updateEntityType(id: $updateEntityTypeId, input: $input) {
      entityType {
        id
      }
    }
  }
`

export const DELETE_ENTITY_TYPE = gql`
  mutation DeleteEntityType($deleteEntityTypeId: ID!) {
    deleteEntityType(id: $deleteEntityTypeId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_ENTITY_TYPE = gql`
  mutation CreateBulkCSVEntityType($input: Upload!) {
    createBulkCSVEntityType(input: $input) {
      entityTypes {
        id
      }
    }
  }
`

export const BULK_DELETE_ENTITY_TYPE = gql`
  mutation DeleteBulkEntityType($ids: [ID!]!) {
    deleteBulkEntityType(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_ENTITY_TYPE = gql`
  mutation UpdateBulkEntityType($ids: [ID!]!, $input: UpdateEntityTypeInput!) {
    updateBulkEntityType(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

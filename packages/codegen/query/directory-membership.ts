import { gql } from 'graphql-request'

export const GET_ALL_DIRECTORY_MEMBERSHIPS = gql`
  query DirectoryMembershipsWithFilter($where: DirectoryMembershipWhereInput, $orderBy: [DirectoryMembershipOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    directoryMemberships(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          directoryAccountID
          directoryGroupID
          directorySyncRunID
          displayID
          environmentID
          environmentName
          firstSeenAt
          id
          integrationID
          lastConfirmedRunID
          lastSeenAt
          metadata
          observedAt
          scopeID
          scopeName
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

export const DIRECTORY_MEMBERSHIP = gql`
  query DirectoryMembership($directoryMembershipId: ID!) {
    directoryMembership(id: $directoryMembershipId) {
      createdAt
      createdBy
      directoryAccountID
      directoryGroupID
      directorySyncRunID
      displayID
      environmentID
      environmentName
      firstSeenAt
      id
      integrationID
      lastConfirmedRunID
      lastSeenAt
      metadata
      observedAt
      scopeID
      scopeName
      source
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_DIRECTORY_MEMBERSHIP = gql`
  mutation CreateDirectoryMembership($input: CreateDirectoryMembershipInput!) {
    createDirectoryMembership(input: $input) {
      directoryMembership {
        id
      }
    }
  }
`

export const UPDATE_DIRECTORY_MEMBERSHIP = gql`
  mutation UpdateDirectoryMembership($updateDirectoryMembershipId: ID!, $input: UpdateDirectoryMembershipInput!) {
    updateDirectoryMembership(id: $updateDirectoryMembershipId, input: $input) {
      directoryMembership {
        id
      }
    }
  }
`

export const DELETE_DIRECTORY_MEMBERSHIP = gql`
  mutation DeleteDirectoryMembership($deleteDirectoryMembershipId: ID!) {
    deleteDirectoryMembership(id: $deleteDirectoryMembershipId) {
      deletedID
    }
  }
`

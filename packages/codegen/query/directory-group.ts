import { gql } from 'graphql-request'

export const GET_ALL_DIRECTORY_GROUPS = gql`
  query DirectoryGroupsWithFilter($where: DirectoryGroupWhereInput, $orderBy: [DirectoryGroupOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    directoryGroups(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          description
          directorySyncRunID
          displayID
          displayName
          email
          environmentID
          environmentName
          externalID
          externalSharingAllowed
          id
          integrationID
          memberCount
          observedAt
          profile
          profileHash
          rawProfileFileID
          scopeID
          scopeName
          sourceVersion
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

export const DIRECTORY_GROUP = gql`
  query DirectoryGroup($directoryGroupId: ID!) {
    directoryGroup(id: $directoryGroupId) {
      createdAt
      createdBy
      description
      directorySyncRunID
      displayID
      displayName
      email
      environmentID
      environmentName
      externalID
      externalSharingAllowed
      id
      integrationID
      memberCount
      observedAt
      profile
      profileHash
      rawProfileFileID
      scopeID
      scopeName
      sourceVersion
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_DIRECTORY_GROUP = gql`
  mutation CreateDirectoryGroup($input: CreateDirectoryGroupInput!) {
    createDirectoryGroup(input: $input) {
      directoryGroup {
        id
      }
    }
  }
`

export const UPDATE_DIRECTORY_GROUP = gql`
  mutation UpdateDirectoryGroup($updateDirectoryGroupId: ID!, $input: UpdateDirectoryGroupInput!) {
    updateDirectoryGroup(id: $updateDirectoryGroupId, input: $input) {
      directoryGroup {
        id
      }
    }
  }
`

export const DELETE_DIRECTORY_GROUP = gql`
  mutation DeleteDirectoryGroup($deleteDirectoryGroupId: ID!) {
    deleteDirectoryGroup(id: $deleteDirectoryGroupId) {
      deletedID
    }
  }
`

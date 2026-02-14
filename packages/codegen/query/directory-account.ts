import { gql } from 'graphql-request'

export const GET_ALL_DIRECTORY_ACCOUNTS = gql`
  query DirectoryAccountsWithFilter($where: DirectoryAccountWhereInput, $orderBy: [DirectoryAccountOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    directoryAccounts(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          canonicalEmail
          createdAt
          createdBy
          department
          directorySyncRunID
          displayID
          displayName
          environmentID
          environmentName
          externalID
          familyName
          givenName
          id
          integrationID
          jobTitle
          lastLoginAt
          lastSeenIP
          observedAt
          organizationUnit
          profile
          profileHash
          rawProfileFileID
          scopeID
          scopeName
          secondaryKey
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

export const DIRECTORY_ACCOUNT = gql`
  query DirectoryAccount($directoryAccountId: ID!) {
    directoryAccount(id: $directoryAccountId) {
      canonicalEmail
      createdAt
      createdBy
      department
      directorySyncRunID
      displayID
      displayName
      environmentID
      environmentName
      externalID
      familyName
      givenName
      id
      integrationID
      jobTitle
      lastLoginAt
      lastSeenIP
      observedAt
      organizationUnit
      profile
      profileHash
      rawProfileFileID
      scopeID
      scopeName
      secondaryKey
      sourceVersion
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_DIRECTORY_ACCOUNT = gql`
  mutation CreateDirectoryAccount($input: CreateDirectoryAccountInput!) {
    createDirectoryAccount(input: $input) {
      directoryAccount {
        id
      }
    }
  }
`

export const UPDATE_DIRECTORY_ACCOUNT = gql`
  mutation UpdateDirectoryAccount($updateDirectoryAccountId: ID!, $input: UpdateDirectoryAccountInput!) {
    updateDirectoryAccount(id: $updateDirectoryAccountId, input: $input) {
      directoryAccount {
        id
      }
    }
  }
`

export const DELETE_DIRECTORY_ACCOUNT = gql`
  mutation DeleteDirectoryAccount($deleteDirectoryAccountId: ID!) {
    deleteDirectoryAccount(id: $deleteDirectoryAccountId) {
      deletedID
    }
  }
`

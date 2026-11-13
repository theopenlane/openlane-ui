import { gql } from 'graphql-request'

export const GET_VENDOR_DIRECTORY = gql`
  query GetVendorDirectory($where: DirectoryGroupWhereInput!, $first: Int, $after: Cursor) {
    directoryGroups(where: $where, orderBy: [{ field: display_name, direction: ASC }], first: $first, after: $after) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          displayName
          email
          integration {
            id
            name
          }
          members {
            totalCount
          }
          matchedAccounts: accounts(where: { identityHolderIDNotNil: true }) {
            totalCount
          }
        }
      }
    }
  }
`

export const GET_VENDOR_DIRECTORY_COVERAGE = gql`
  query GetVendorDirectoryCoverage($integrationIDs: [ID!]!) {
    allGroups: directoryGroups(where: { integrationIDIn: $integrationIDs }) {
      totalCount
    }
    emptyGroups: directoryGroups(where: { integrationIDIn: $integrationIDs, hasMembers: false }) {
      totalCount
    }
    groupedAccounts: directoryAccounts(where: { integrationIDIn: $integrationIDs, hasGroups: true }) {
      totalCount
    }
    matchedAccounts: directoryAccounts(where: { integrationIDIn: $integrationIDs, hasGroups: true, identityHolderIDNotNil: true }) {
      totalCount
    }
  }
`

export const GET_DIRECTORY_GROUP_MEMBERS = gql`
  query GetDirectoryGroupMembers($groupID: ID!, $first: Int, $after: Cursor) {
    directoryGroup(id: $groupID) {
      id
      members(first: $first, after: $after, orderBy: [{ field: created_at, direction: DESC }]) {
        totalCount
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            id
            role
            addedAt
            removedAt
            directoryAccount {
              id
              canonicalEmail
              displayName
              givenName
              familyName
              identityHolder {
                id
                fullName
                email
              }
            }
          }
        }
      }
    }
  }
`

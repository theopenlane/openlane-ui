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
          sourceDefinitionID
          managedBy
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
  query GetVendorDirectoryCoverage($vendorId: ID!) {
    allGroups: directoryGroups(where: { hasIntegrationWith: [{ hasEntitiesWith: [{ id: $vendorId }] }] }) {
      totalCount
    }
    emptyGroups: directoryGroups(where: { hasIntegrationWith: [{ hasEntitiesWith: [{ id: $vendorId }] }], hasMembers: false }) {
      totalCount
    }
    groupedAccounts: directoryAccounts(where: { hasIntegrationWith: [{ hasEntitiesWith: [{ id: $vendorId }] }], hasGroups: true }) {
      totalCount
    }
    matchedAccounts: directoryAccounts(where: { hasIntegrationWith: [{ hasEntitiesWith: [{ id: $vendorId }] }], hasGroups: true, identityHolderIDNotNil: true }) {
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

export const GET_VENDOR_DIRECTORY_GROUP_COUNT = gql`
  query GetVendorDirectoryGroupCount($vendorId: ID!) {
    directoryGroups(where: { hasIntegrationWith: [{ hasEntitiesWith: [{ id: $vendorId }] }] }) {
      totalCount
    }
  }
`

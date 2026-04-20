import { gql } from 'graphql-request'

const DIRECTORY_MEMBERSHIP_CONNECTION_FIELDS = gql`
  fragment DirectoryMembershipConnectionFields on DirectoryMembershipConnection {
    totalCount
    edges {
      node {
        id
        role
        addedAt
        removedAt
        createdAt
        directoryGroup {
          displayName
        }
      }
    }
  }
`

export const GET_ALL_IDENTITY_HOLDERS = gql`
  query IdentityHoldersWithFilter($where: IdentityHolderWhereInput, $orderBy: [IdentityHolderOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    identityHolders(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          emailAliases
          createdAt
          createdBy
          department
          displayID
          email
          employerEntityID
          endDate
          environmentID
          environmentName
          externalReferenceID
          externalUserID
          fullName
          hasPendingWorkflow
          hasWorkflowHistory
          id
          identityHolderType
          internalOwner
          internalOwnerGroup {
            id
            displayName
          }
          internalOwnerUser {
            id
            displayName
          }
          isActive
          isOpenlaneUser
          location
          metadata
          phoneNumber
          scopeID
          scopeName
          startDate
          status
          tags
          team
          title
          updatedAt
          updatedBy
          userID
          workflowEligibleMarker
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

export const IDENTITY_HOLDER = gql`
  query IdentityHolder($identityHolderId: ID!) {
    identityHolder(id: $identityHolderId) {
      emailAliases
      createdAt
      createdBy
      department
      displayID
      email
      employerEntityID
      endDate
      environmentID
      environmentName
      externalReferenceID
      externalUserID
      fullName
      hasPendingWorkflow
      hasWorkflowHistory
      id
      identityHolderType
      internalOwner
      internalOwnerGroup {
        id
        displayName
      }
      internalOwnerUser {
        id
        displayName
      }
      isActive
      isOpenlaneUser
      location
      metadata
      phoneNumber
      scopeID
      scopeName
      startDate
      status
      tags
      team
      title
      updatedAt
      updatedBy
      userID
      workflowEligibleMarker
    }
  }
`

export const CREATE_IDENTITY_HOLDER = gql`
  mutation CreateIdentityHolder($input: CreateIdentityHolderInput!) {
    createIdentityHolder(input: $input) {
      identityHolder {
        id
      }
    }
  }
`

export const UPDATE_IDENTITY_HOLDER = gql`
  mutation UpdateIdentityHolder($updateIdentityHolderId: ID!, $input: UpdateIdentityHolderInput!) {
    updateIdentityHolder(id: $updateIdentityHolderId, input: $input) {
      identityHolder {
        id
      }
    }
  }
`

export const DELETE_IDENTITY_HOLDER = gql`
  mutation DeleteIdentityHolder($deleteIdentityHolderId: ID!) {
    deleteIdentityHolder(id: $deleteIdentityHolderId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_IDENTITY_HOLDER = gql`
  mutation CreateBulkCSVIdentityHolder($input: Upload!) {
    createBulkCSVIdentityHolder(input: $input) {
      identityHolders {
        id
      }
    }
  }
`

export const BULK_DELETE_IDENTITY_HOLDER = gql`
  mutation DeleteBulkIdentityHolder($ids: [ID!]!) {
    deleteBulkIdentityHolder(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_IDENTITY_HOLDER = gql`
  mutation UpdateBulkIdentityHolder($ids: [ID!]!, $input: UpdateIdentityHolderInput!) {
    updateBulkIdentityHolder(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const GET_IDENTITY_HOLDER_FILES_PAGINATED = gql`
  query GetIdentityHolderFilesPaginated($identityHolderId: ID!, $after: Cursor, $first: Int, $before: Cursor, $last: Int, $orderBy: [FileOrder!], $where: FileWhereInput) {
    identityHolder(id: $identityHolderId) {
      files(after: $after, first: $first, before: $before, last: $last, orderBy: $orderBy, where: $where) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
        edges {
          node {
            providedFileName
            providedFileSize
            providedFileExtension
            categoryType
            createdAt
            id
            uri
            presignedURL
          }
        }
      }
    }
  }
`

export const UPDATE_IDENTITY_HOLDER_WITH_FILES = gql`
  mutation UpdateIdentityHolderWithFiles($updateIdentityHolderId: ID!, $input: UpdateIdentityHolderInput!, $identityHolderFiles: [Upload!]) {
    updateIdentityHolder(id: $updateIdentityHolderId, input: $input, identityHolderFiles: $identityHolderFiles) {
      identityHolder {
        id
      }
    }
  }
`

export const CREATE_IDENTITY_HOLDER_WITH_FILES = gql`
  mutation CreateIdentityHolderWithFiles($input: CreateIdentityHolderInput!, $identityHolderFiles: [Upload!]) {
    createIdentityHolder(input: $input, identityHolderFiles: $identityHolderFiles) {
      identityHolder {
        id
      }
    }
  }
`

export const GET_IDENTITY_HOLDER_DIRECTORY_ACCOUNTS = gql`
  query GetIdentityHolderDirectoryAccounts($identityHolderId: ID!, $where: DirectoryAccountWhereInput) {
    identityHolder(id: $identityHolderId) {
      directoryAccounts(where: $where) {
        edges {
          node {
            id
            accountType
            status
            primarySource
            mfaState
            directoryName
            memberships(first: 100, orderBy: [{ field: created_at, direction: DESC }]) {
              ...DirectoryMembershipConnectionFields
            }
          }
        }
      }
    }
  }
  ${DIRECTORY_MEMBERSHIP_CONNECTION_FIELDS}
`

export const GET_IDENTITY_HOLDER_ASSOCIATIONS = gql`
  query GetIdentityHolderAssociations($identityHolderId: ID!) {
    identityHolder(id: $identityHolderId) {
      assets {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      entities {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      campaigns {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      tasks {
        edges {
          node {
            id
            title
            displayID
          }
        }
        totalCount
      }
      controls {
        edges {
          node {
            id
            refCode
            displayID
            description
          }
        }
        totalCount
      }
      internalPolicies {
        edges {
          node {
            id
            name
            displayID
            summary
          }
        }
        totalCount
      }
      subcontrols {
        edges {
          node {
            id
            refCode
            displayID
          }
        }
        totalCount
      }
    }
  }
`

export const GET_IDENTITY_HOLDER_ASSOCIATIONS_TIMELINE = gql`
  query GetIdentityHolderAssociationsTimeline($identityHolderId: ID!) {
    identityHolder(id: $identityHolderId) {
      assessmentResponses {
        edges {
          node {
            id
            createdAt
            completedAt
            assessment {
              id
              name
            }
          }
        }
      }
      directoryAccounts {
        edges {
          node {
            id
            createdAt
            directoryName
            displayName
            canonicalEmail
            memberships(first: 75, orderBy: [{ field: created_at, direction: DESC }]) {
              ...DirectoryMembershipConnectionFields
            }
          }
        }
      }
      user {
        id
        createdAt
        displayName
        email
      }
    }
  }
  ${DIRECTORY_MEMBERSHIP_CONNECTION_FIELDS}
`

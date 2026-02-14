import { gql } from 'graphql-request'

export const GET_ALL_IDENTITY_HOLDERS = gql`
  query IdentityHoldersWithFilter($where: IdentityHolderWhereInput, $orderBy: [IdentityHolderOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    identityHolders(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          alternateEmail
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
          internalOwner
          internalOwnerGroupID
          internalOwnerUserID
          isActive
          isOpenlaneUser
          location
          metadata
          phoneNumber
          scopeID
          scopeName
          startDate
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
      alternateEmail
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
      internalOwner
      internalOwnerGroupID
      internalOwnerUserID
      isActive
      isOpenlaneUser
      location
      metadata
      phoneNumber
      scopeID
      scopeName
      startDate
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

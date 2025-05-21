import { gql } from 'graphql-request'

export const UPDATE_USER_ROLE_IN_ORG = gql`
  mutation UpdateUserRoleInOrg($updateOrgMemberId: ID!, $input: UpdateOrgMembershipInput!) {
    updateOrgMembership(id: $updateOrgMemberId, input: $input) {
      orgMembership {
        id
        role
        userID
        organizationID
      }
    }
  }
`

export const REMOVE_USER_FROM_ORG = gql`
  mutation RemoveUserFromOrg($deleteOrgMembershipId: ID!) {
    deleteOrgMembership(id: $deleteOrgMembershipId) {
      deletedID
    }
  }
`

export const GET_ORG_MEMBERSHIPS = gql`
  query OrgMemberships($after: Cursor, $first: Int, $before: Cursor, $last: Int) {
    orgMemberships(after: $after, first: $first, before: $before, last: $last) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
      edges {
        node {
          id
          createdAt
          role
          user {
            id
            firstName
            lastName
            displayName
            authProvider
            avatarRemoteURL
            email
            role
            createdAt
            avatarFile {
              id
              presignedURL
            }
          }
        }
      }
    }
  }
`

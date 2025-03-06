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

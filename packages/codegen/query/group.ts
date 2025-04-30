import { gql } from 'graphql-request'

export const GET_ALL_GROUPS = gql`
  query GetAllGroups($where: GroupWhereInput, $orderBy: [GroupOrder!], $first: Int, $after: Cursor) {
    groups(where: $where, orderBy: $orderBy, first: $first, after: $after) {
      edges {
        node {
          id
          name
          description
          displayName
          logoURL
          isManaged
          tags
          members {
            id
            role
            user {
              id
              firstName
              lastName
              avatarFile {
                presignedURL
              }
              displayName
              avatarRemoteURL
              role
            }
          }
          setting {
            visibility
            joinPolicy
            syncToSlack
            syncToGithub
            id
          }
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`

export const CREATE_GROUP_WITH_MEMBERS = gql`
  mutation CreateGroupWithMembers($groupInput: CreateGroupInput!, $members: [GroupMembersInput!]) {
    createGroupWithMembers(groupInput: $groupInput, members: $members) {
      group {
        id
        displayID
      }
    }
  }
`

export const UPDATE_GROUP = gql`
  mutation UpdateGroup($updateGroupId: ID!, $input: UpdateGroupInput!) {
    updateGroup(id: $updateGroupId, input: $input) {
      group {
        id
      }
    }
  }
`

export const DELETE_GROUP = gql`
  mutation DeleteGroup($deleteGroupId: ID!) {
    deleteGroup(id: $deleteGroupId) {
      deletedID
    }
  }
`

export const GET_GROUP_DETAILS = gql`
  query GetGroupDetails($groupId: ID!) {
    group(id: $groupId) {
      id
      name
      description
      displayName
      logoURL
      isManaged
      tags
      members {
        id
        role
        user {
          id
          firstName
          lastName
          avatarFile {
            presignedURL
          }
          avatarRemoteURL
          role
        }
      }
      setting {
        visibility
        joinPolicy
        syncToSlack
        syncToGithub
        id
      }
    }
  }
`

export const UPDATE_GROUP_MEMBERSHIP = gql`
  mutation UpdateGroupMembership($updateGroupMembershipId: ID!, $input: UpdateGroupMembershipInput!) {
    updateGroupMembership(id: $updateGroupMembershipId, input: $input) {
      groupMembership {
        id
      }
    }
  }
`

export const GET_GROUP_PERMISSIONS = gql`
  query GetGroupPermissions($groupId: ID!) {
    group(id: $groupId) {
      permissions {
        displayID
        id
        name
        objectType
        permissions
      }
    }
  }
`

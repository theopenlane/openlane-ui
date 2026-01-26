import { gql } from 'graphql-request'

export const GET_ALL_GROUPS = gql`
  query GetAllGroups($where: GroupWhereInput, $orderBy: [GroupOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    groups(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          description
          name
          displayName
          gravatarLogoURL
          logoURL
          tags
          members {
            edges {
              node {
                id
                role
                user {
                  id
                  avatarFile {
                    presignedURL
                  }
                  displayName
                  avatarRemoteURL
                  role
                }
              }
            }
          }
          setting {
            visibility
            joinPolicy
            syncToSlack
            syncToGithub
            id
          }
          updatedAt
          updatedBy
          createdAt
          createdBy
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
        edges {
          node {
            id
            role
            user {
              id
              displayName
              avatarFile {
                presignedURL
              }
              avatarRemoteURL
              role
            }
          }
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
        edges {
          node {
            id
            name
            objectType
            permissions
          }
        }
      }
    }
  }
`
export const DELETE_GROUP_MEMBERSHIP = gql`
  mutation DeleteGroupMembership($deleteGroupMembershipId: ID!) {
    deleteGroupMembership(id: $deleteGroupMembershipId) {
      deletedID
    }
  }
`

export const ALL_GROUPS_PAGINATED_FIELDS_FRAGMENT = gql`
  fragment AllGroupsPaginatedFields on Group {
    id
    name
    displayName
    description
    isManaged
    tags
    setting {
      visibility
    }
  }
`

export const GET_ALL_GROUPS_PAGINATED = gql`
  ${ALL_GROUPS_PAGINATED_FIELDS_FRAGMENT}
  query GetAllGroupsPaginated($where: GroupWhereInput, $after: Cursor, $orderBy: [GroupOrder!]) {
    groups(where: $where, after: $after, orderBy: $orderBy) {
      edges {
        node {
          ...AllGroupsPaginatedFields
        }
        cursor
      }
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

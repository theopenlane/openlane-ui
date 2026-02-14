import { gql } from 'graphql-request'

export const GET_ALL_GROUP_SETTINGS = gql`
  query GroupSettingsWithFilter($where: GroupSettingWhereInput, $orderBy: [GroupSettingOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    groupSettings(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          groupID
          id
          syncToGithub
          syncToSlack
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

export const GROUP_SETTING = gql`
  query GroupSetting($groupSettingId: ID!) {
    groupSetting(id: $groupSettingId) {
      createdAt
      createdBy
      groupID
      id
      syncToGithub
      syncToSlack
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_GROUP_SETTING = gql`
  mutation CreateGroupSetting($input: CreateGroupSettingInput!) {
    createGroupSetting(input: $input) {
      groupSetting {
        id
      }
    }
  }
`

export const UPDATE_GROUP_SETTING = gql`
  mutation UpdateGroupSetting($updateGroupSettingId: ID!, $input: UpdateGroupSettingInput!) {
    updateGroupSetting(id: $updateGroupSettingId, input: $input) {
      groupSetting {
        id
      }
    }
  }
`

export const DELETE_GROUP_SETTING = gql`
  mutation DeleteGroupSetting($deleteGroupSettingId: ID!) {
    deleteGroupSetting(id: $deleteGroupSettingId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_GROUP_SETTING = gql`
  mutation CreateBulkCSVGroupSetting($input: Upload!) {
    createBulkCSVGroupSetting(input: $input) {
      groupSettings {
        id
      }
    }
  }
`

export const BULK_DELETE_GROUP_SETTING = gql`
  mutation DeleteBulkGroupSetting($ids: [ID!]!) {
    deleteBulkGroupSetting(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_GROUP_SETTING = gql`
  mutation UpdateBulkGroupSetting($ids: [ID!]!, $input: UpdateGroupSettingInput!) {
    updateBulkGroupSetting(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

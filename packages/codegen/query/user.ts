import { gql } from 'graphql-request'

export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
      firstName
      lastName
      displayName
      email
      avatarRemoteURL
      avatarFile {
        presignedURL
      }
      setting {
        id
        status
        tags
        isTfaEnabled
        defaultOrg {
          id
          displayName
        }
      }
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser($updateUserId: ID!, $input: UpdateUserInput!, $avatarFile: Upload) {
    updateUser(id: $updateUserId, input: $input, avatarFile: $avatarFile) {
      user {
        id
        avatarFile {
          presignedURL
        }
      }
    }
  }
`

export const UPDATE_USER_SETTING = gql`
  mutation UpdateUserSetting($updateUserSettingId: ID!, $input: UpdateUserSettingInput!) {
    updateUserSetting(id: $updateUserSettingId, input: $input) {
      userSetting {
        id
      }
    }
  }
`

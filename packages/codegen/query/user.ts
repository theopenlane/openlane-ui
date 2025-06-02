import { gql } from 'graphql-request'

export const GET_USER_PROFILE = gql`
  query GetUserProfile($userId: ID!) {
    user(id: $userId) {
      id
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
        isWebauthnAllowed
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

export const GET_USERS = gql`
  query GetAllUsers($where: UserWhereInput) {
    users(where: $where) {
      edges {
        node {
          id
          displayName
          avatarRemoteURL
          avatarFile {
            presignedURL
          }
        }
      }
    }
  }
`

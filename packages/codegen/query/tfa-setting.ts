import { gql } from 'graphql-tag'

export const GET_TFA_SETTINGS = gql`
  query GetTFASettings {
    tfaSettings {
      edges {
        node {
          id
        }
      }
    }
  }
`

export const GET_USER_TFA_SETTINGS = gql`
  query GetUserTFASettings($userId: ID!) {
    user(id: $userId) {
      tfaSettings {
        edges {
          node {
            id
            totpAllowed
            verified
          }
        }
      }
    }
  }
`

export const UPDATE_TFA_SETTING = gql`
  mutation UpdateTFASetting($input: UpdateTFASettingInput!) {
    updateTFASetting(input: $input) {
      qrCode
      recoveryCodes
      tfaSecret
      tfaSetting {
        id
      }
    }
  }
`

export const CREATE_TFA_SETTING = gql`
  mutation CreateTFASetting($input: CreateTFASettingInput!) {
    createTFASetting(input: $input) {
      qrCode
      tfaSecret
      tfaSetting {
        id
      }
    }
  }
`

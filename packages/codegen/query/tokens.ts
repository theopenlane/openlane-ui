import { gql } from 'graphql-request'

export const CREATE_PERSONAL_ACCESS_TOKEN = gql`
  mutation CreatePersonalAccessToken($input: CreatePersonalAccessTokenInput!) {
    createPersonalAccessToken(input: $input) {
      personalAccessToken {
        token
      }
    }
  }
`

export const GET_PERSONAL_ACCESS_TOKENS = gql`
  query GetPersonalAccessTokens {
    personalAccessTokens {
      edges {
        node {
          id
          name
          description
          expiresAt
          organizations {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    }
  }
`

export const DELETE_PERSONAL_ACCESS_TOKEN = gql`
  mutation DeletePersonalAccessToken($deletePersonalAccessTokenId: ID!) {
    deletePersonalAccessToken(id: $deletePersonalAccessTokenId) {
      deletedID
    }
  }
`

export const CREATE_API_TOKEN = gql`
  mutation CreateAPIToken($input: CreateAPITokenInput!) {
    createAPIToken(input: $input) {
      apiToken {
        token
      }
    }
  }
`

export const GET_API_TOKENS = gql`
  query GetAPITokens {
    apiTokens {
      edges {
        node {
          id
          name
          description
          scopes
          expiresAt
        }
      }
    }
  }
`

export const DELETE_API_TOKEN = gql`
  mutation DeleteAPIToken($deleteAPITokenId: ID!) {
    deleteAPIToken(id: $deleteAPITokenId) {
      deletedID
    }
  }
`

import { gql } from 'graphql-tag'

export const GET_PASSKEYS = gql`
  query GetPasskeys {
    webauthns {
      edges {
        node {
          id
          backupState
          backupEligible
          createdAt
          tags
          aaguid
        }
      }
    }
  }
`

export const DELETE_PASSKEY = gql`
  mutation DeletePasskey($deleteWebauthnId: ID!) {
    deleteWebauthn(id: $deleteWebauthnId) {
      deletedID
    }
  }
`

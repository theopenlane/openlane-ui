import { gql } from 'graphql-request'
import { useQuery, useMutation } from '@tanstack/react-query'

export const GET_TRUST_CENTER_ENTITIES = gql`
  query GetTrustCenterEntities($where: TrustcenterEntityWhereInput) {
    trustcenterEntities(where: $where) {
      edges {
        node {
          id
          name
          url
          logoFile {
            presignedURL
          }
        }
      }
    }
  }
`

export const CREATE_TRUST_CENTER_ENTITY = gql`
  mutation CreateTrustcenterEntity($input: CreateTrustcenterEntityInput!, $logoFile: Upload) {
    createTrustcenterEntity(input: $input, logoFile: $logoFile) {
      trustcenterEntity {
        id
      }
    }
  }
`

export const DELETE_TRUST_CENTER_ENTITY = gql`
  mutation DeleteTrustcenterEntity($deleteTrustcenterEntityId: ID!) {
    deleteTrustcenterEntity(id: $deleteTrustcenterEntityId) {
      deletedID
    }
  }
`

export const UPDATE_TRUST_CENTER_ENTITY = gql`
  mutation UpdateTrustcenterEntity($updateTrustcenterEntityId: ID!, $input: UpdateTrustcenterEntityInput!, $logoFile: Upload) {
    updateTrustcenterEntity(id: $updateTrustcenterEntityId, input: $input, logoFile: $logoFile) {
      trustcenterEntity {
        id
      }
    }
  }
`

import { gql } from 'graphql-request'
import { useQuery, useMutation } from '@tanstack/react-query'

export const GET_ALL_TRUST_CENTERS_ENTITIES = gql`
  query GetTrustCenterEntities($where: TrustCenterEntityWhereInput) {
    trustCenterEntities(where: $where) {
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
  mutation CreateTrustCenterEntity($input: CreateTrustCenterEntityInput!, $logoFile: Upload) {
    createTrustCenterEntity(input: $input, logoFile: $logoFile) {
      trustCenterEntity {
        id
      }
    }
  }
`

export const DELETE_TRUST_CENTER_ENTITY = gql`
  mutation DeleteTrustCenterEntity($deleteTrustCenterEntityId: ID!) {
    deleteTrustCenterEntity(id: $deleteTrustCenterEntityId) {
      deletedID
    }
  }
`

export const UPDATE_TRUST_CENTER_ENTITY = gql`
  mutation UpdateTrustCenterEntity($updateTrustCenterEntityId: ID!, $input: UpdateTrustCenterEntityInput!, $logoFile: Upload) {
    updateTrustCenterEntity(id: $updateTrustCenterEntityId, input: $input, logoFile: $logoFile) {
      trustCenterEntity {
        id
      }
    }
  }
`

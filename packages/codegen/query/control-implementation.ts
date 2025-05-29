import { gql } from 'graphql-request'

export const CONTROL_IMPLEMENTATION_FIELDS = gql`
  fragment ControlImplementationFields on ControlImplementation {
    id
    details
    status
    implementationDate
    verified
    controls {
      edges {
        node {
          id
          refCode
          description
          standard {
            shortName
          }
        }
      }
    }
    subcontrols {
      edges {
        node {
          id
          refCode
          control {
            refCode
            description
            id
          }
        }
      }
    }
  }
`
export const GET_ALL_CONTROL_IMPLEMENTATIONS = gql`
  ${CONTROL_IMPLEMENTATION_FIELDS}

  query GetAllControlImplementations($where: ControlImplementationWhereInput) {
    controlImplementations(where: $where) {
      edges {
        node {
          ...ControlImplementationFields
        }
      }
    }
  }
`

export const CREATE_CONTROL_IMPLEMENTATION = gql`
  mutation CreateControlImplementation($input: CreateControlImplementationInput!) {
    createControlImplementation(input: $input) {
      controlImplementation {
        id
      }
    }
  }
`

export const UPDATE_CONTROL_IMPLEMENTATION = gql`
  mutation UpdateControlImplementation($updateControlImplementationId: ID!, $input: UpdateControlImplementationInput!) {
    updateControlImplementation(id: $updateControlImplementationId, input: $input) {
      controlImplementation {
        id
      }
    }
  }
`

export const DELETE_CONTROL_IMPLEMENTATION = gql`
  mutation DeleteControlImplementation($deleteControlImplementationId: ID!) {
    deleteControlImplementation(id: $deleteControlImplementationId) {
      deletedID
    }
  }
`

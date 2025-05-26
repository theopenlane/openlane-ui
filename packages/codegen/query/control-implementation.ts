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

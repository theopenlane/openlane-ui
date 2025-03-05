import { gql } from 'graphql-request'

export const GET_ALL_SUBCONTROLS = gql`
  query GetAllSubcontrols($where: SubcontrolWhereInput) {
    subcontrols(where: $where) {
      edges {
        node {
          id
          name
          displayID
          description
        }
      }
    }
  }
`

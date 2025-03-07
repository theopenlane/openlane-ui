import { gql } from 'graphql-request'

export const GET_ALL_CONTROLS = gql`
  query GetAllControls($where: ControlWhereInput) {
    controls(where: $where) {
      edges {
        node {
          id
          displayID
        }
      }
    }
  }
`

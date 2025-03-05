import { gql } from 'graphql-request'

export const GET_ALL_CONTROL_OBJECTIVES = gql`
  query GetAllControlObjectives($where: ControlObjectiveWhereInput) {
    controlObjectives(where: $where) {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
  }
`

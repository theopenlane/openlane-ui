import { gql } from 'graphql-request'

export const CONTROL_OBJECTIVE_FIELDS = gql`
  fragment ControlObjectiveFields on ControlObjective {
    id
    name
    displayID
  }
`

export const GET_ALL_CONTROL_OBJECTIVES = gql`
  ${CONTROL_OBJECTIVE_FIELDS}

  query GetAllControlObjectives($where: ControlObjectiveWhereInput) {
    controlObjectives(where: $where) {
      edges {
        node {
          ...ControlObjectiveFields
        }
      }
    }
  }
`

export const CREATE_CONTROL_OBJECTIVE = gql`
  mutation CreateControlObjective($input: CreateControlObjectiveInput!) {
    createControlObjective(input: $input) {
      controlObjective {
        id
      }
    }
  }
`

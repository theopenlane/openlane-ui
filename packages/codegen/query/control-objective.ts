import { gql } from 'graphql-request'

export const CONTROL_OBJECTIVE_FIELDS = gql`
  fragment ControlObjectiveFields on ControlObjective {
    id
    name
    displayID
    blockedGroups {
      id
      name
    }
    category
    controlObjectiveType
    controls {
      edges {
        node {
          id
          refCode
          standard {
            shortName
            description
          }
        }
      }
    }
    createdAt
    createdBy
    deletedAt
    deletedBy
    desiredOutcome
    editors {
      id
      name
    }
    evidence {
      edges {
        node {
          id
          name
        }
      }
    }
    internalPolicies {
      edges {
        node {
          id
          name
        }
      }
    }
    narratives {
      edges {
        node {
          id
        }
      }
    }
    owner {
      id
      name
    }
    ownerID
    procedures {
      edges {
        node {
          id
          name
        }
      }
    }
    programs {
      edges {
        node {
          id
          name
        }
      }
    }
    revision
    risks {
      edges {
        node {
          id
          name
        }
      }
    }
    source
    status
    subcategory
    subcontrols {
      edges {
        node {
          id
          refCode
          description
        }
      }
    }
    tags
    tasks {
      edges {
        node {
          id
          title
        }
      }
    }
    updatedAt
    updatedBy
    viewers {
      id
      name
    }
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

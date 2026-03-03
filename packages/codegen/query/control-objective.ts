import { gql } from 'graphql-request'

export const CONTROL_OBJECTIVE_FIELDS = gql`
  fragment ControlObjectiveFields on ControlObjective {
    id
    name
    status
    controlObjectiveType
    source
    category
    revision
    subcategory
    desiredOutcome
    controls {
      edges {
        node {
          id
          refCode
          description
          referenceFramework
          __typename
        }
      }
    }
    subcontrols {
      edges {
        node {
          id
          refCode
          referenceFramework
          __typename
          control {
            id
            refCode
            description
          }
        }
      }
    }
    programs {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    evidence {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    internalPolicies {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    procedures {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    risks {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    tasks {
      edges {
        node {
          id
          title
          displayID
        }
      }
    }
  }
`

export const GET_ALL_CONTROL_OBJECTIVES = gql`
  ${CONTROL_OBJECTIVE_FIELDS}

  query GetAllControlObjectives($where: ControlObjectiveWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controlObjectives(where: $where, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          ...ControlObjectiveFields
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
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
export const UPDATE_CONTROL_OBJECTIVE = gql`
  mutation UpdateControlObjective($updateControlObjectiveId: ID!, $input: UpdateControlObjectiveInput!) {
    updateControlObjective(id: $updateControlObjectiveId, input: $input) {
      controlObjective {
        id
      }
    }
  }
`

export const DELETE_CONTROL_OBJECTIVE = gql`
  mutation DeleteControlObjective($deleteControlObjectiveId: ID!) {
    deleteControlObjective(id: $deleteControlObjectiveId) {
      deletedID
    }
  }
`

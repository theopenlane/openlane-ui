import { gql } from 'graphql-request'

export const CONTROL_LIST_FIELDS_FRAGMENT = gql`
  fragment ControlListFields on Control {
    id
    refCode
    description
    status
    category
    subcategory
    tags
    mappedCategories
    subcontrols {
      totalCount
    }
    controlOwner {
      id
      displayName
      logoURL
      gravatarLogoURL
    }
  }
`

export const CONTROL_DETAILS_FIELDS_FRAGMENT = gql`
  fragment ControlDetailsFields on Control {
    id
    category
    refCode
    subcategory
    mappedCategories
    status
    tags
    description
    implementationGuidance
    exampleEvidence
    controlQuestions
    assessmentMethods
    assessmentObjectives
    displayID
    controlObjectives {
      edges {
        node {
          id
          status
          desiredOutcome
          name
          displayID
        }
      }
    }
    controlImplementations {
      edges {
        node {
          details
          status
          verificationDate
        }
      }
    }
    evidence {
      edges {
        node {
          displayID
          name
          creationDate
          displayID
        }
      }
    }
    subcontrols {
      totalCount
      edges {
        node {
          id
          refCode
          description
        }
      }
    }
    internalPolicies {
      totalCount
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    procedures {
      totalCount
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    tasks {
      totalCount
      edges {
        node {
          id
          title
          displayID
        }
      }
    }
    programs {
      totalCount
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    risks {
      totalCount
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
    delegate {
      id
      displayName
      logoURL
      gravatarLogoURL
    }
    controlOwner {
      id
      displayName
      logoURL
      gravatarLogoURL
    }
  }
`

export const GET_ALL_CONTROLS = gql`
  ${CONTROL_LIST_FIELDS_FRAGMENT}
  query GetAllControls($where: ControlWhereInput, $orderBy: [ControlOrder!], $first: Int, $after: Cursor) {
    controls(where: $where, orderBy: $orderBy, first: $first, after: $after) {
      edges {
        node {
          ...ControlListFields
        }
        cursor
      }
      pageInfo {
        endCursor
        startCursor
      }
      totalCount
    }
  }
`

export const GET_CONTROL_BY_ID = gql`
  ${CONTROL_DETAILS_FIELDS_FRAGMENT}
  query GetControlById($controlId: ID!) {
    control(id: $controlId) {
      ...ControlDetailsFields
    }
  }
`

export const UPDATE_CONTROL = gql`
  mutation UpdateControl($updateControlId: ID!, $input: UpdateControlInput!) {
    updateControl(id: $updateControlId, input: $input) {
      control {
        id
      }
    }
  }
`
export const SEARCH_CONTROLS = gql`
  query SearchControls($query: String!) {
    controlSearch(query: $query) {
      edges {
        node {
          id
        }
      }
      pageInfo {
        endCursor
        startCursor
      }
      totalCount
    }
  }
`

import { gql } from 'graphql-request'

export const CONTROL_FIELDS_FRAGMENT = gql`
  fragment ControlFields on Control {
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
    createdBy
    updatedBy
    updatedAt
    createdAt

    controlObjectives {
      edges {
        node {
          status
          desiredOutcome
          name
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
        }
      }
    }
    subcontrols {
      totalCount
      edges {
        node {
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
        }
      }
    }
    procedures {
      totalCount
      edges {
        node {
          id
          name
        }
      }
    }
    tasks {
      totalCount
      edges {
        node {
          id
          title
        }
      }
    }
    programs {
      totalCount
      edges {
        node {
          id
          name
        }
      }
    }
    risks {
      totalCount
      edges {
        node {
          id
          name
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
    owner {
      users {
        avatarRemoteURL
        firstName
        lastName
      }
    }
  }
`

export const GET_ALL_CONTROLS = gql`
  ${CONTROL_FIELDS_FRAGMENT}
  query GetAllControls($where: ControlWhereInput) {
    controls(where: $where) {
      edges {
        node {
          ...ControlFields
        }
      }
    }
  }
`

export const GET_CONTROL_BY_ID = gql`
  ${CONTROL_FIELDS_FRAGMENT}
  query GetControlById($controlId: ID!) {
    control(id: $controlId) {
      ...ControlFields
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

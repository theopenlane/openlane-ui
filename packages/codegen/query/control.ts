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
    owner {
      users {
        avatarRemoteURL
        firstName
        lastName
      }
    }
    subcontrols {
      totalCount
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

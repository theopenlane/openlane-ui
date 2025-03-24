import { gql } from 'graphql-request'

export const GET_ALL_CONTROLS = gql`
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

import { gql } from 'graphql-request'

export const GET_ALL_SUBCONTROLS = gql`
  query GetAllSubcontrols($where: SubcontrolWhereInput) {
    subcontrols(where: $where) {
      edges {
        node {
          id
          displayID
          description
        }
      }
    }
  }
`

export const GET_SUBCONTROL_BY_ID = gql`
  query GetSubcontrolById($subcontrolId: ID!) {
    subcontrol(id: $subcontrolId) {
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
      control {
        refCode
        id
      }
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
  }
`

export const UPDATE_SUBCONTROL = gql`
  mutation updateSubcontrol($updateSubcontrolId: ID!, $input: UpdateSubcontrolInput!) {
    updateSubcontrol(id: $updateSubcontrolId, input: $input) {
      subcontrol {
        id
      }
    }
  }
`

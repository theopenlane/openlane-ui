import { gql } from 'graphql-request'

export const GET_ALL_SUBCONTROLS = gql`
  query GetAllSubcontrols($where: SubcontrolWhereInput) {
    subcontrols(where: $where) {
      edges {
        node {
          id
          displayID
          description
          refCode
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
            id
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
            approver {
              gravatarLogoURL
              logoURL
              displayName
            }
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
            approver {
              gravatarLogoURL
              logoURL
              displayName
            }
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
            details
            assignee {
              displayName
              avatarFile {
                presignedURL
              }
              avatarRemoteURL
            }
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
            details
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

export const DELETE_SUBCONTROL = gql`
  mutation DeleteSubcontrol($deleteSubcontrolId: ID!) {
    deleteSubcontrol(id: $deleteSubcontrolId) {
      deletedID
    }
  }
`

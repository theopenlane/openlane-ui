import { gql } from 'graphql-request'

export const GET_ALL_SUBCONTROLS = gql`
  query GetAllSubcontrols($where: SubcontrolWhereInput, $after: Cursor, $first: Int) {
    subcontrols(where: $where, after: $after, first: $first) {
      edges {
        node {
          id
          displayID
          description
          refCode
          referenceFramework
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

export const GET_SUBCONTROL_BY_ID = gql`
  query GetSubcontrolById($subcontrolId: ID!) {
    subcontrol(id: $subcontrolId) {
      __typename
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
      source
      controlType
      auditorReferenceID
      referenceID
      referenceFramework
      title
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
export const CREATE_SUBCONTROL = gql`
  mutation CreateSubcontrol($input: CreateSubcontrolInput!) {
    createSubcontrol(input: $input) {
      subcontrol {
        id
      }
    }
  }
`

export const GET_SUBCONTROL_SELECT_OPTIONS = gql`
  query GetSubcontrolSelectOptions($where: SubcontrolWhereInput) {
    subcontrols(where: $where) {
      edges {
        node {
          id
          refCode
          category
          subcategory
          referenceFramework
        }
      }
    }
  }
`

export const GET_SUBCONTROLS_PAGINATED = gql`
  query GetSubcontrolsPaginated($where: SubcontrolWhereInput, $after: Cursor) {
    subcontrols(where: $where, after: $after) {
      totalCount
      edges {
        node {
          __typename
          id
          refCode
          category
          subcategory
          referenceFramework
          controlID
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_SUBCONTROL_BY_ID_MINIFIED = gql`
  query GetSubcontrolByIdMinified($subcontrolId: ID!) {
    subcontrol(id: $subcontrolId) {
      id
      refCode
      control {
        id
        standardID
      }
      category
      subcategory
      description
      referenceFramework
      title
    }
  }
`

export const GET_SUBCONTROLS_BY_REFCODE = gql`
  query GetSubcontrolsByRefCode($refCodeIn: [String!]) {
    subcontrols(where: { refCodeIn: $refCodeIn }) {
      edges {
        node {
          id
          refCode
          systemOwned
          controlID
          control {
            standardID
          }
        }
      }
    }
  }
`

export const GET_SUBCONTROL_COMMENTS = gql`
  query GetSubcontrolComments($subcontrolId: ID!) {
    subcontrol(id: $subcontrolId) {
      comments {
        edges {
          node {
            id
            createdAt
            createdBy
            owner {
              avatarRemoteURL
              avatarFile {
                presignedURL
              }
              displayName
            }
            text
          }
        }
      }
    }
  }
`

export const UPDATE_SUBCONTROL_COMMENT = gql`
  mutation UpdateSubcontrolComment($updateSubcontrolCommentId: ID!, $input: UpdateNoteInput!) {
    updateSubontrolComment(id: $updateSubcontrolCommentId, input: $input) {
      subcontrol {
        id
      }
    }
  }
`

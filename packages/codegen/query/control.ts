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
          id
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
    programs {
      totalCount
      edges {
        node {
          id
          name
          displayID
          status
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
`

export const GET_ALL_CONTROLS = gql`
  ${CONTROL_LIST_FIELDS_FRAGMENT}
  query GetAllControls($where: ControlWhereInput, $orderBy: [ControlOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controls(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          ...ControlListFields
        }
        cursor
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

export const GET_CONTROL_COUNTS_BY_STATUS = gql`
  query GetControlCountsByStatus($programId: ID!) {
    preparing: controls(where: { status: PREPARING, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    needsApproval: controls(where: { status: NEEDS_APPROVAL, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    changesRequested: controls(where: { status: CHANGES_REQUESTED, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    approved: controls(where: { status: APPROVED, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
  }
`

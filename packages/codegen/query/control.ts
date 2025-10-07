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
    referenceFramework
    referenceID
    auditorReferenceID
    source
    controlType
    subcontrols {
      totalCount
    }
    controlOwner {
      id
      displayName
      logoURL
      gravatarLogoURL
    }
    subcontrols {
      edges {
        node {
          id
          refCode
        }
      }
    }
    delegate {
      displayName
      logoURL
      gravatarLogoURL
    }
    updatedAt
    updatedBy
    createdAt
    createdBy
  }
`

export const CONTROL_LIST_STANDARDS_FIELDS_FRAGMENT = gql`
  fragment ControlListStandardFields on Control {
    id
    refCode
    description
    category
    subcategory
    mappedCategories
    referenceFramework
    subcontrols {
      totalCount
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
    source
    controlType
    auditorReferenceID
    referenceID
    referenceFramework
    title
    __typename
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
          description
        }
      }
    }
    subcontrols {
      totalCount
      edges {
        node {
          __typename
          id
          refCode
          description
          displayID
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
          summary
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
          summary
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
          description
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

export const CREATE_CSV_BULK_CONTROL = gql`
  mutation CreateBulkCSVControl($input: Upload!) {
    createBulkCSVControl(input: $input) {
      controls {
        id
      }
    }
  }
`

export const DELETE_CONTROL = gql`
  mutation DeleteControl($deleteControlId: ID!) {
    deleteControl(id: $deleteControlId) {
      deletedID
    }
  }
`

export const CREATE_CONTROL = gql`
  mutation CreateControl($input: CreateControlInput!) {
    createControl(input: $input) {
      control {
        id
      }
    }
  }
`

export const GET_CONTROL_SELECT_OPTIONS = gql`
  query GetControlSelectOptions($where: ControlWhereInput, $first: Int = 10) {
    controls(where: $where, first: $first) {
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

export const GET_CONTROL_CATEGORIES = gql`
  query GetControlCategories {
    controlCategories
  }
`

export const GET_CONTROL_SUBCATEGORIES = gql`
  query GetControlSubcategories {
    controlSubcategories
  }
`

export const GET_CONTROLS_PAGINATED = gql`
  query GetControlsPaginated($where: ControlWhereInput, $after: Cursor) {
    controls(where: $where, after: $after) {
      totalCount
      edges {
        node {
          __typename
          id
          refCode
          category
          subcategory
          referenceFramework
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_CONTROL_BY_ID_MINIFIED = gql`
  query GetControlByIdMinified($controlId: ID!) {
    control(id: $controlId) {
      id
      refCode
      standardID
      category
      subcategory
      description
      referenceFramework
      title
    }
  }
`

export const GET_CONTROLS_PAGINATED_WITH_LIST_FIELDS = gql`
  ${CONTROL_LIST_STANDARDS_FIELDS_FRAGMENT}
  query GetControlsPaginatedWithListFields($where: ControlWhereInput, $after: Cursor) {
    controls(where: $where, after: $after) {
      totalCount
      edges {
        node {
          ...ControlListStandardFields
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_CONTROLS_GROUPED_BY_CATEGORY_RESOLVER = gql`
  query GetControlsGroupedByCategoryResolver($where: ControlWhereInput, $category: String, $after: Cursor) {
    controlsGroupByCategory(where: $where, category: $category, after: $after) {
      edges {
        node {
          category
          controls {
            totalCount
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              node {
                __typename
                id
                refCode
                status
                referenceFramework
              }
            }
          }
        }
      }
    }
  }
`

export const BULK_EDIT_CONTROL = gql`
  mutation UpdateBulkControl($ids: [ID!]!, $input: UpdateControlInput!) {
    updateBulkControl(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

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
    controlKindName
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

    controlImplementations {
      edges {
        node {
          details
        }
      }
    }
    comments {
      totalCount
    }
    updatedAt
    updatedBy
    createdAt
    createdBy
    controlObjectives {
      edges {
        node {
          desiredOutcome
        }
      }
    }
    tasks {
      edges {
        node {
          id
          title
        }
      }
      totalCount
    }
    internalPolicies {
      edges {
        node {
          id
          name
        }
      }
      totalCount
    }
    procedures {
      edges {
        node {
          id
          name
        }
      }
      totalCount
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
      edges {
        node {
          id
          name
        }
      }
      totalCount
    }
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
    controlObjectives {
      edges {
        node {
          desiredOutcome
        }
      }
    }
    controlImplementations {
      edges {
        node {
          details
        }
      }
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
    descriptionJSON
    implementationGuidance
    exampleEvidence
    evidenceRequests
    controlQuestions
    assessmentMethods
    assessmentObjectives
    testingProcedures
    references
    displayID
    source
    controlKindName
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
          status
          subcontrolKindName
          source
          category
          subcategory
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
          __typename
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

export const GET_CONTROL_ASSOCIATIONS_BY_ID = gql`
  query GetControlAssociationsById($controlId: ID!) {
    control(id: $controlId) {
      internalPolicies {
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
        totalCount
      }

      procedures {
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
        totalCount
      }

      tasks {
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
        totalCount
      }

      programs {
        edges {
          node {
            id
            name
            displayID
            status
            description
          }
        }
        totalCount
      }

      risks {
        edges {
          node {
            id
            name
            displayID
            details
          }
        }
        totalCount
      }
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

export const GET_CONTROL_NOT_IMPLEMENTED_COUNT = gql`
  query GetNotImplementedControlCount {
    controls(where: { status: NOT_IMPLEMENTED, systemOwned: false }) {
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

export const UPDATE_CSV_BULK_CONTROL = gql`
  mutation UpdateBulkCSVControl($input: Upload!) {
    updateBulkCSVControl(input: $input) {
      controls {
        id
      }
    }
  }
`

export const CREATE_CSV_BULK_MAPPED_CONTROL = gql`
  mutation CreateBulkCSVMappedControl($input: Upload!) {
    createBulkCSVMappedControl(input: $input) {
      mappedControls {
        id
      }
    }
  }
`

export const CLONE_CSV_BULK_CONTROL = gql`
  mutation CloneBulkCSVControl($input: Upload!) {
    cloneBulkCSVControl(input: $input) {
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

export const GET_CONTROLS_BY_REFCODE = gql`
  query GetControlsByRefCode($refCodeIn: [String!]) {
    controls(where: { refCodeIn: $refCodeIn }) {
      edges {
        node {
          id
          refCode
          description
          status
          controlKindName
          source
          category
          subcategory
          referenceFramework
          standardID
          ownerID
          systemOwned
        }
      }
    }
  }
`

export const GET_CONTROL_COMMENTS = gql`
  query GetControlComments($controlId: ID!) {
    control(id: $controlId) {
      comments {
        edges {
          node {
            id
            createdAt
            createdBy
            text
          }
        }
      }
    }
  }
`
export const UPDATE_CONTROL_COMMENT = gql`
  mutation UpdateControlComment($updateControlCommentId: ID!, $input: UpdateNoteInput!) {
    updateControlComment(id: $updateControlCommentId, input: $input) {
      control {
        id
      }
    }
  }
`

export const DELETE_NOTE = gql`
  mutation DeleteNote($deleteNoteId: ID!) {
    deleteNote(id: $deleteNoteId) {
      deletedID
    }
  }
`

export const BULK_DELETE_CONTROL = gql`
  mutation DeleteBulkControl($ids: [ID!]!) {
    deleteBulkControl(ids: $ids) {
      deletedIDs
    }
  }
`
export const GET_SUGGESTED_CONTROLS_OR_SUBCONTROLS = gql`
  query GetSuggestedControlsOrSubcontrols($where: MappedControlWhereInput) {
    mappedControls(where: $where) {
      edges {
        node {
          id
          source
          fromControls {
            edges {
              node {
                id
                referenceFramework
                refCode
                __typename
              }
            }
          }
          toControls {
            edges {
              node {
                id
                referenceFramework
                refCode
                __typename
              }
            }
          }
          fromSubcontrols {
            edges {
              node {
                id
                referenceFramework
                refCode
                __typename
              }
            }
          }
          toSubcontrols {
            edges {
              node {
                id
                referenceFramework
                refCode
                __typename
              }
            }
          }
        }
      }
    }
  }
`

export const GET_EXISTING_CONTROLS_FOR_ORGANIZATION = gql`
  query GetExistingControlsForOrganization($where: ControlWhereInput) {
    controls(where: $where) {
      edges {
        node {
          id
          refCode
          referenceFramework
          standardID
          ownerID
          systemOwned
        }
      }
    }
  }
`

export const CONTROL_DISCUSSION_FIELDS_FRAGMENT = gql`
  fragment ControlDiscussionFields on Control {
    id
    refCode
    title
    __typename
    discussions {
      edges {
        node {
          id
          externalID
          createdAt
          comments {
            edges {
              node {
                updatedBy
                updatedAt
                text
                noteRef
                isEdited
                id
                displayID
                discussionID
                createdAt
                createdBy
              }
            }
          }
        }
      }
    }
  }
`

export const GET_CONTROL_DISCUSSION_BY_ID = gql`
  ${CONTROL_DISCUSSION_FIELDS_FRAGMENT}
  query GetControlDiscussionById($controlId: ID!) {
    control(id: $controlId) {
      ...ControlDiscussionFields
    }
  }
`

export const INSERT_CONTROL_PLATE_COMMENT = gql`
  mutation InsertControlPlateComment($updateControlId: ID!, $input: UpdateControlInput!) {
    updateControl(id: $updateControlId, input: $input) {
      control {
        discussions {
          edges {
            node {
              id
              externalID
              isResolved
              externalID
              comments {
                edges {
                  node {
                    text
                    isEdited
                    id
                    noteRef
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

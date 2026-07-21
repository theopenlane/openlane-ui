import { gql } from 'graphql-request'

export const CONTROL_LIST_FIELDS_FRAGMENT = gql`
  fragment ControlListFields on Control {
    id
    refCode
    referenceFramework
    description @include(if: $includeDescription)
    status @include(if: $includeStatus)
    category @include(if: $includeCategory)
    subcategory @include(if: $includeSubcategory)
    referenceID @include(if: $includeReferenceID)
    auditorReferenceID @include(if: $includeAuditorReferenceID)
    source @include(if: $includeSource)
    sourceName @include(if: $includeSourceName)
    controlKindName @include(if: $includeControlKindName)
    title @include(if: $includeTitle)
    updatedAt @include(if: $includeUpdatedAt)
    updatedBy @include(if: $includeUpdatedBy)
    createdAt @include(if: $includeCreatedAt)
    createdBy @include(if: $includeCreatedBy)
    controlOwner @include(if: $includeControlOwner) {
      id
      displayName
      logoURL
      gravatarLogoURL
      avatarFile {
        base64
      }
    }
    subcontrols @include(if: $includeSubcontrols) {
      totalCount
      edges {
        node {
          id
          refCode
        }
      }
    }
    delegate @include(if: $includeDelegate) {
      displayName
      logoURL
      gravatarLogoURL
      avatarFile {
        base64
      }
    }
    responsibleParty @include(if: $includeResponsibleParty) {
      id
      displayName
      name
      logoFile {
        base64
      }
    }
    controlImplementations @include(if: $includeControlImplementations) {
      edges {
        node {
          details
        }
      }
    }
    comments @include(if: $includeComments) {
      totalCount
    }
    controlObjectives @include(if: $includeControlObjectives) {
      edges {
        node {
          desiredOutcome
        }
      }
    }
    tasks @include(if: $includeTasks) {
      edges {
        node {
          id
          title
        }
      }
      totalCount
    }
    internalPolicies @include(if: $includeInternalPolicies) {
      edges {
        node {
          id
          name
        }
      }
      totalCount
    }
    procedures @include(if: $includeProcedures) {
      edges {
        node {
          id
          name
        }
      }
      totalCount
    }
    programs @include(if: $includePrograms) {
      totalCount
      edges {
        node {
          id
          name
        }
      }
    }
    risks @include(if: $includeRisks) {
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
    title
    description
    category
    subcategory
    mappedCategories
    tags
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
    relatedControls @include(if: $includeRelatedControls) {
      id
      status
    }
    trustCenterVisibility
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
    sourceName
    controlKindName
    publicRepresentation
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
          files {
            edges {
              node {
                id
                providedFileName
                presignedURL
              }
            }
          }
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
          evidence {
            edges {
              node {
                id
                name
                status
              }
            }
          }
        }
      }
    }
    delegate {
      id
      displayName
      logoURL
      gravatarLogoURL
      avatarFile {
        base64
      }
    }
    controlOwner {
      id
      displayName
      logoURL
      gravatarLogoURL
      avatarFile {
        base64
      }
    }
    responsibleParty {
      id
      displayName
      name
      logoFile {
        base64
      }
    }
    externalUUID
    aliases
  }
`

export const GET_ALL_CONTROLS = gql`
  ${CONTROL_LIST_FIELDS_FRAGMENT}
  query GetAllControls(
    $where: ControlWhereInput
    $orderBy: [ControlOrder!]
    $first: Int
    $after: Cursor
    $last: Int
    $before: Cursor
    $includeDescription: Boolean = false
    $includeStatus: Boolean = false
    $includeCategory: Boolean = false
    $includeSubcategory: Boolean = false
    $includeReferenceID: Boolean = false
    $includeAuditorReferenceID: Boolean = false
    $includeSource: Boolean = false
    $includeSourceName: Boolean = false
    $includeControlKindName: Boolean = false
    $includeTitle: Boolean = false
    $includeCreatedAt: Boolean = false
    $includeCreatedBy: Boolean = false
    $includeUpdatedAt: Boolean = false
    $includeUpdatedBy: Boolean = false
    $includeControlOwner: Boolean = false
    $includeSubcontrols: Boolean = false
    $includeDelegate: Boolean = false
    $includeResponsibleParty: Boolean = false
    $includeControlImplementations: Boolean = false
    $includeComments: Boolean = false
    $includeControlObjectives: Boolean = false
    $includeTasks: Boolean = false
    $includeInternalPolicies: Boolean = false
    $includeProcedures: Boolean = false
    $includePrograms: Boolean = false
    $includeRisks: Boolean = false
  ) {
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
              avatarFile {
                base64
              }
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
              avatarFile {
                base64
              }
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
                base64
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
      assets {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      scans {
        edges {
          node {
            id
            target
          }
        }
        totalCount
      }
      entities {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      identityHolders {
        edges {
          node {
            id
            fullName
            displayID
            identityHolderType
            title
          }
        }
        totalCount
      }
      campaigns {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      remediations {
        edges {
          node {
            id
            title
            displayID
          }
        }
        totalCount
      }
      reviews {
        edges {
          node {
            id
            title
          }
        }
        totalCount
      }
      findings {
        edges {
          node {
            id
            displayName
            displayID
          }
        }
        totalCount
      }
      controlMappings(first: 200) {
        edges {
          node {
            id
            findingID
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
    created: controls(where: { statusIn: [DRAFT, PREPARING, NOT_IMPLEMENTED], hasProgramsWith: [{ id: $programId }] }) {
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
          title
          description
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

export const GET_AUDITOR_DASHBOARD_CONTROLS = gql`
  query GetAuditorDashboardControls($where: ControlWhereInput, $programId: ID!, $orderBy: [ControlOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    controls(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          refCode
          title
          controlOwner {
            displayName
            gravatarLogoURL
            logoURL
            avatarFile {
              base64
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
          evidence(where: { hasProgramsWith: [{ id: $programId }] }) {
            totalCount
            edges {
              node {
                id
                name
                status
              }
            }
          }
          reviews(where: { hasProgramsWith: [{ id: $programId }] }) {
            edges {
              node {
                id
                status
                reviewedAt
              }
            }
          }
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
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
  query GetControlsPaginatedWithListFields($where: ControlWhereInput, $after: Cursor, $includeRelatedControls: Boolean = false) {
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

export const CONTROL_REPORT_FIELDS_FRAGMENT = gql`
  fragment ControlReportFields on ControlReport {
    id
    refCode
    title
    description
    status
    category
    subcategory
    referenceFramework
    controlOwner {
      displayName
      gravatarLogoURL
      avatarFile {
        base64
      }
    }
    relatedControls {
      id
      refCode
      status
      referenceFramework
      isSubcontrol
    }
    linkedPolicies {
      totalCount
      internalPolicies {
        id
        name
        status
      }
    }
    evidenceStatus {
      totalCount
      worstStatus
      approvedCount
      countByStatus {
        status
        totalCount
      }
    }
  }
`

export const CONTROL_REPORTS_BY_CATEGORY = gql`
  ${CONTROL_REPORT_FIELDS_FRAGMENT}
  query ControlReportsByCategory($where: ControlWhereInput) {
    controlReportsByCategory(where: $where) {
      category
      totalCount
      controls {
        ...ControlReportFields
        subcontrols {
          ...ControlReportFields
        }
      }
    }
  }
`

export const CONTROL_REPORTS = gql`
  ${CONTROL_REPORT_FIELDS_FRAGMENT}
  query ControlReports($where: ControlWhereInput, $orderBy: [ControlReportOrder!], $first: Int, $after: Cursor) {
    controlReports(where: $where, orderBy: $orderBy, first: $first, after: $after) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...ControlReportFields
          subcontrols {
            ...ControlReportFields
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

export const GET_SUBCONTROL_IDS_BY_CONTROL = gql`
  query GetSubcontrolIdsByControl($where: SubcontrolWhereInput) {
    subcontrols(where: $where) {
      edges {
        node {
          id
        }
      }
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
          isTrustCenterControl
          internalPolicies {
            edges {
              node {
                id
                name
              }
            }
          }
          evidence {
            edges {
              node {
                id
                name
                status
              }
            }
          }
        }
      }
    }
  }
`

export const GET_PROGRAM_CONTROLS_BY_REFCODE = gql`
  query GetProgramControlsByRefCode($refCodeIn: [String!], $programId: ID!) {
    controls(where: { refCodeIn: $refCodeIn, hasProgramsWith: [{ id: $programId }] }) {
      edges {
        node {
          id
          refCode
        }
      }
    }
  }
`

export const GET_CONTROL_RELATED_CONTROLS = gql`
  query GetControlRelatedControls($controlId: ID!) {
    control(id: $controlId) {
      id
      relatedControls {
        id
        refCode
        status
        referenceFramework
        isSubcontrol
        parentControlID
        mappedControlReferenceIDs
        inheritedFromSubcontrolIDs
        category
        subcategory
        description
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
      notDeletedIDs
      error
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
          isResolved
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

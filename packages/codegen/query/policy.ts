import { gql } from 'graphql-request'

export const CREATE_INTERNAL_POLICY = gql`
  mutation CreateInternalPolicy($input: CreateInternalPolicyInput!) {
    createInternalPolicy(input: $input) {
      internalPolicy {
        id
        name
        internalPolicyKindName
        details
      }
    }
  }
`

export const UPDATE_INTERNAL_POLICY = gql`
  mutation UpdateInternalPolicy($updateInternalPolicyId: ID!, $input: UpdateInternalPolicyInput!) {
    updateInternalPolicy(id: $updateInternalPolicyId, input: $input) {
      internalPolicy {
        id
        name
        internalPolicyKindName
        details
      }
    }
  }
`

export const DELETE_INTERNAL_POLICY = gql`
  mutation DeleteInternalPolicy($deleteInternalPolicyId: ID!) {
    deleteInternalPolicy(id: $deleteInternalPolicyId) {
      deletedID
    }
  }
`

export const GET_INTERNAL_POLICIES_LIST = gql`
  query GetInternalPoliciesList($orderBy: [InternalPolicyOrder!], $where: InternalPolicyWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    internalPolicies(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          updatedAt
          updatedBy
          createdAt
          createdBy
          summary
          approvalRequired
          approver {
            displayName
            gravatarLogoURL
            logoURL
          }
          delegate {
            displayName
            gravatarLogoURL
            logoURL
          }
          internalPolicyKindName
          reviewDue
          reviewFrequency
          revision
          status
          tags
          controls {
            edges {
              node {
                id
                refCode
              }
            }
          }
          procedures {
            edges {
              node {
                id
                name
              }
            }
          }
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

export const GET_ALL_INTERNAL_POLICIES = gql`
  query GetAllInternalPolicies($where: InternalPolicyWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    internalPolicies(where: $where, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          name
          summary
          displayID
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

export const INTERNAL_POLICY_BY_ID = gql`
  fragment InternalPolicyByID on InternalPolicy {
    id
    name
    details
    createdAt
    createdBy
    updatedAt
    updatedBy
    tags
    revision
    status
    displayID
    details
    reviewDue
    reviewFrequency
    approvalRequired
    summary
    detailsJSON
    internalPolicyKindName
    approver {
      id
      displayName
      gravatarLogoURL
      logoURL
    }
    delegate {
      id
      displayName
      gravatarLogoURL
      logoURL
    }
  }
`

export const GET_INTERNAL_POLICY_DETAILS_BY_ID = gql`
  query GetInternalPolicyDetailsById($internalPolicyId: ID!) {
    internalPolicy(id: $internalPolicyId) {
      ...InternalPolicyByID
    }
  }
  ${INTERNAL_POLICY_BY_ID}
`

export const GET_INTERNAL_POLICY_ASSOCIATIONS_BY_ID = gql`
  query GetInternalPolicyAssociationsById($internalPolicyId: ID!) {
    internalPolicy(id: $internalPolicyId) {
      procedures {
        edges {
          node {
            id
            name
            displayID
            summary
          }
        }
        totalCount
      }
      controls {
        edges {
          node {
            id
            displayID
            refCode
            description
          }
        }
        totalCount
      }
      subcontrols {
        edges {
          node {
            id
            displayID
            refCode
            description
            controlId: controlID
          }
        }
        totalCount
      }
      programs {
        edges {
          node {
            id
            displayID
            name
            description
          }
        }
        totalCount
      }
      tasks {
        edges {
          node {
            id
            displayID
            title
            details
          }
        }
        totalCount
      }
      controlObjectives {
        edges {
          node {
            id
            displayID
            name
          }
        }
        totalCount
      }
    }
  }
`

export const CREATE_CSV_BULK_INTERNAL_POLICY = gql`
  mutation CreateBulkCSVInternalPolicy($input: Upload!) {
    createBulkCSVInternalPolicy(input: $input) {
      internalPolicies {
        id
      }
    }
  }
`

export const BULK_EDIT_INTERNAL_POLICY = gql`
  mutation UpdateBulkInternalPolicy($ids: [ID!]!, $input: UpdateInternalPolicyInput!) {
    updateBulkInternalPolicy(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const CREATE_UPLOAD_POLICY = gql`
  mutation CreateUploadInternalPolicy($internalPolicyFile: Upload!) {
    createUploadInternalPolicy(internalPolicyFile: $internalPolicyFile) {
      internalPolicy {
        fileID
        id
      }
    }
  }
`

export const GET_INTERNAL_POLICIES_DASHBOARD = gql`
  query GetInternalPoliciesDashboard($where: InternalPolicyWhereInput) {
    internalPolicies(where: $where, orderBy: [{ field: updated_at, direction: DESC }]) {
      edges {
        node {
          id
          name
          internalPolicyKindName
          status
          createdAt
          updatedAt
          createdBy
          updatedBy
        }
      }
    }
  }
`
export const GET_POLICY_SUGGESTED_ACTIONS = gql`
  query PolicySuggestedActions($currentUserIdID: ID!, $currentUserIdString: String!, $sevenDaysAgo: Time!, $commentsSince: Time!) {
    needsMyApproval: internalPolicies(where: { approvalRequired: true, status: NEEDS_APPROVAL, hasApproverWith: [{ hasUsersWith: { id: $currentUserIdID } }] }) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }

    missingApprover: internalPolicies(where: { approvalRequired: true, hasApprover: false, or: { updatedBy: $currentUserIdString, createdBy: $currentUserIdString } }) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }

    stillDraftAfterWeek: internalPolicies(where: { approvalRequired: true, status: DRAFT, updatedBy: $currentUserIdString, updatedAtLT: $sevenDaysAgo }) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }

    recentComments: internalPolicies(
      where: {
        or: { updatedBy: $currentUserIdString, createdBy: $currentUserIdString, hasApproverWith: [{ hasUsersWith: { id: $currentUserIdID } }] }
        and: { hasCommentsWith: [{ createdAtGT: $commentsSince, createdByNEQ: $currentUserIdString }], not: { hasCommentsWith: [{ createdAtGT: $commentsSince, createdBy: $currentUserIdString }] } }
      }
    ) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }
  }
`

export const BULK_DELETE_POLICY = gql`
  mutation DeleteBulkInternalPolicy($ids: [ID!]!) {
    deleteBulkInternalPolicy(ids: $ids) {
      deletedIDs
    }
  }
`

export const POLICY_DISCUSSION_FIELDS_FRAGMENT = gql`
  fragment PolicyDiscussionFields on InternalPolicy {
    id
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

export const GET_POLICY_DISCUSSION_BY_ID = gql`
  ${POLICY_DISCUSSION_FIELDS_FRAGMENT}
  query GetPolicyDiscussionById($policyId: ID!) {
    internalPolicy(id: $policyId) {
      ...PolicyDiscussionFields
    }
  }
`

export const INSERT_POLICY_COMMENT = gql`
  mutation InsertInternalPolicyComment($updateInternalPolicyId: ID!, $input: UpdateInternalPolicyInput!) {
    updateInternalPolicy(id: $updateInternalPolicyId, input: $input) {
      internalPolicy {
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

export const UPDATE_POLICY_COMMENT = gql`
  mutation UpdatePolicyComment($updateInternalPolicyCommentId: ID!, $input: UpdateNoteInput!) {
    updateInternalPolicyComment(id: $updateInternalPolicyCommentId, input: $input) {
      internalPolicy {
        id
      }
    }
  }
`

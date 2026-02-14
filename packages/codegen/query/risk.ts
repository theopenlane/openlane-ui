import { gql } from 'graphql-request'

const RISK_FIELDS = gql`
  fragment RiskFields on Risk {
    id
    displayID
    name
    details
    detailsJSON
    tags
    riskCategoryName
    riskKindName
    score
    status
    businessCosts
    likelihood
    impact
    mitigation
    stakeholder {
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
    procedures {
      edges {
        node {
          id
          name
          displayID
          summary
        }
      }
    }
    controls {
      edges {
        node {
          id
          displayID
          refCode
        }
      }
    }
    subcontrols {
      edges {
        node {
          id
          displayID
          refCode
          controlId: controlID
        }
      }
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
    }
    internalPolicies {
      edges {
        node {
          id
          displayID
          name
        }
      }
    }
  }
`

const RISK_TABLE_FIELDS = gql`
  fragment RiskTableFields on Risk {
    id
    displayID
    name
    riskCategoryName
    riskKindName
    score
    status
    businessCosts
    delegate {
      displayName
      gravatarLogoURL
      logoURL
    }
    details
    impact
    likelihood
    mitigation
    updatedAt
    updatedBy
    createdAt
    createdBy
    stakeholder {
      id
      displayName
      gravatarLogoURL
      logoURL
    }
  }
`

export const GET_RISK_BY_ID = gql`
  query GetRiskByID($riskId: ID!) {
    risk(id: $riskId) {
      ...RiskFields
    }
  }
  ${RISK_FIELDS}
`

export const GET_ALL_RISKS = gql`
  query GetAllRisks($where: RiskWhereInput, $orderBy: [RiskOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    risks(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
      edges {
        node {
          ...RiskTableFields
        }
      }
    }
  }

  ${RISK_TABLE_FIELDS}
`

export const UPDATE_RISK = gql`
  mutation UpdateRisk($updateRiskId: ID!, $input: UpdateRiskInput!) {
    updateRisk(id: $updateRiskId, input: $input) {
      risk {
        id
      }
    }
  }
`
export const BULK_EDIT_RISK = gql`
  mutation UpdateBulkRisk($ids: [ID!]!, $input: UpdateRiskInput!) {
    updateBulkRisk(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const CREATE_CSV_BULK_RISK = gql`
  mutation CreateBulkCSVRisk($input: Upload!) {
    createBulkCSVRisk(input: $input) {
      risks {
        id
      }
    }
  }
`

export const DELETE_RISK = gql`
  mutation DeleteRisk($deleteRiskId: ID!) {
    deleteRisk(id: $deleteRiskId) {
      deletedID
    }
  }
`

export const CREATE_RISK = gql`
  mutation CreateRisk($input: CreateRiskInput!) {
    createRisk(input: $input) {
      risk {
        id
      }
    }
  }
`

export const BULK_DELETE_RISK = gql`
  mutation DeleteBulkRisk($ids: [ID!]!) {
    deleteBulkRisk(ids: $ids) {
      deletedIDs
    }
  }
`

export const GET_RISK_OPEN_AND_IDENTIFIED_COUNT = gql`
  query GetOpenRiskCount {
    risks(where: { statusIn: [OPEN, IDENTIFIED] }) {
      totalCount
    }
  }
`

export const RISK_DISCUSSION_FIELDS_FRAGMENT = gql`
  fragment RiskDiscussionFields on Risk {
    id
    name
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

export const GET_RISK_DISCUSSION_BY_ID = gql`
  ${RISK_DISCUSSION_FIELDS_FRAGMENT}
  query GetRiskDiscussionById($riskId: ID!) {
    risk(id: $riskId) {
      ...RiskDiscussionFields
    }
  }
`

export const INSERT_RISK_COMMENT = gql`
  mutation InsertRiskComment($updateRiskId: ID!, $input: UpdateRiskInput!) {
    updateRisk(id: $updateRiskId, input: $input) {
      risk {
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
export const UPDATE_RISK_COMMENT = gql`
  mutation UpdateRiskComment($updateRiskCommentId: ID!, $input: UpdateNoteInput!) {
    updateRiskComment(id: $updateRiskCommentId, input: $input) {
      risk {
        id
      }
    }
  }
`

import { gql } from 'graphql-request'

export const CREATE_PROCEDURE = gql`
  mutation CreateProcedure($input: CreateProcedureInput!) {
    createProcedure(input: $input) {
      procedure {
        id
        name
      }
    }
  }
`

export const UPDATE_PROCEDURE = gql`
  mutation UpdateProcedure($updateProcedureId: ID!, $input: UpdateProcedureInput!) {
    updateProcedure(id: $updateProcedureId, input: $input) {
      procedure {
        id
        name
        procedureKindName
      }
    }
  }
`

export const BULK_EDIT_PROCEDURE = gql`
  mutation UpdateBulkProcedure($ids: [ID!]!, $input: UpdateProcedureInput!) {
    updateBulkProcedure(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const GET_ALL_PROCEDURES_WITH_DETAILS = gql`
  query GetAllProceduresWithDetails {
    procedures {
      edges {
        node {
          id
          name
          status
          revision
          updatedAt
          updatedBy
          createdAt
          createdBy
          tags
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

export const GET_TABLE_PROCEDURES = gql`
  query GetProceduresTableList($orderBy: [ProcedureOrder!], $where: ProcedureWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    procedures(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
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
          procedureKindName
          reviewDue
          reviewFrequency
          revision
          status
          tags
          internalPolicies {
            edges {
              node {
                id
                name
              }
            }
          }
          controls {
            edges {
              node {
                id
                refCode
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
    }
  }
`

export const GET_ALL_PROCEDURES = gql`
  query GetProceduresList($orderBy: [ProcedureOrder!], $where: ProcedureWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    procedures(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          displayID
          status
          revision
          updatedAt
          updatedBy
          createdAt
          createdBy
          tags
          details
          summary
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`

export const PROCEDURE_BY_ID = gql`
  fragment ProcedureByID on Procedure {
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
    procedureKindName
    detailsJSON
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
export const GET_PROCEDURE_ASSOCIATIONS_BY_ID = gql`
  query GetProcedureAssociationsById($procedureId: ID!) {
    procedure(id: $procedureId) {
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

      internalPolicies {
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
            control {
              id
            }
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
    }
  }
`

export const GET_PROCEDURE_DETAILS_BY_ID = gql`
  query GetProcedureDetailsById($procedureId: ID!) {
    procedure(id: $procedureId) {
      ...ProcedureByID
    }
  }
  ${PROCEDURE_BY_ID}
`

export const DELETE_PROCEDURE = gql`
  mutation DeleteProcedure($deleteProcedureId: ID!) {
    deleteProcedure(id: $deleteProcedureId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_PROCEDURE = gql`
  mutation CreateBulkCSVProcedure($input: Upload!) {
    createBulkCSVProcedure(input: $input) {
      procedures {
        id
      }
    }
  }
`

export const CREATE_UPLOAD_PROCEDURE = gql`
  mutation CreateUploadProcedure($procedureFile: Upload!) {
    createUploadProcedure(procedureFile: $procedureFile) {
      procedure {
        fileID
        id
      }
    }
  }
`

export const BULK_DELETE_PROCEDURE = gql`
  mutation DeleteBulkProcedure($ids: [ID!]!) {
    deleteBulkProcedure(ids: $ids) {
      deletedIDs
    }
  }
`

export const PROCEDURE_DISCUSSION_FIELDS_FRAGMENT = gql`
  fragment ProcedureDiscussionFields on Procedure {
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

export const GET_PROCEDURE_DISCUSSION_BY_ID = gql`
  ${PROCEDURE_DISCUSSION_FIELDS_FRAGMENT}
  query GetProcedureDiscussionById($procedureId: ID!) {
    procedure(id: $procedureId) {
      ...ProcedureDiscussionFields
    }
  }
`

export const INSERT_PROCEDURE_COMMENT = gql`
  mutation InsertProcedureComment($updateProcedureId: ID!, $input: UpdateProcedureInput!) {
    updateProcedure(id: $updateProcedureId, input: $input) {
      procedure {
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

export const UPDATE_PROCEDURE_COMMENT = gql`
  mutation UpdateProcedureComment($updateProcedureCommentId: ID!, $input: UpdateNoteInput!) {
    updateProcedureComment(id: $updateProcedureCommentId, input: $input) {
      procedure {
        id
      }
    }
  }
`

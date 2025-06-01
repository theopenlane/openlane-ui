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
        procedureType
      }
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
    procedureType
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
    narratives {
      edges {
        node {
          id
          displayID
        }
      }
    }
    risks {
      edges {
        node {
          id
          name
          displayID
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
        }
      }
      totalCount
    }
    internalPolicies {
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

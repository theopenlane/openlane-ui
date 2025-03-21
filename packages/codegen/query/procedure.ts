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
  query GetAllProcedures($where: ProcedureWhereInput) {
    procedures(where: $where) {
      edges {
        node {
          id
          name
          displayID
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
        }
      }
    }
  }
`

export const GET_PROCEDURE_DETAILS_BY_ID = gql`
  query GetProcedureDetailsById($procedureId: ID!) {
    procedure(id: $procedureId) {
      id
      name
      details
      details
      createdAt
      createdBy
      updatedAt
      updatedBy
      tags
      revision
      status
      procedureType
      displayID
      internalPolicies {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`

export const DELETE_PROCEDURE = gql`
  mutation DeleteProcedure($deleteProcedureId: ID!) {
    deleteProcedure(id: $deleteProcedureId) {
      deletedID
    }
  }
`

export const SEARCH_PROCEDURES = gql`
  query SearchProcedures($query: String!) {
    procedureSearch(query: $query) {
      procedures {
        id
        name
        details
        displayID

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
`

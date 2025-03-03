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
          background
          description
          procedureType
          purposeAndScope
          satisfies
          status
          version
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
      description
      details
      background
      createdAt
      createdBy
      updatedAt
      updatedBy
      tags
      version
      status
      satisfies
      purposeAndScope
      procedureType
      internalPolicies {
        id
        name
      }
    }
  }
`

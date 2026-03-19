import { gql } from 'graphql-request'

export const GET_ALL_SLA_DEFINITIONS = gql`
  query SLADefinitionsWithFilter($where: SLADefinitionWhereInput, $orderBy: [SLADefinitionOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    slaDefinitions(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          displayID
          id
          slaDays
          slaDefinitionSeverityLevelID
          slaDefinitionSeverityLevelName
          updatedAt
          updatedBy
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

export const SLA_DEFINITION = gql`
  query SLADefinition($slaDefinitionId: ID!) {
    slaDefinition(id: $slaDefinitionId) {
      createdAt
      createdBy
      displayID
      id
      slaDays
      slaDefinitionSeverityLevelID
      slaDefinitionSeverityLevelName
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_SLA_DEFINITION = gql`
  mutation CreateSLADefinition($input: CreateSLADefinitionInput!) {
    createSLADefinition(input: $input) {
      slaDefinition {
        id
      }
    }
  }
`

export const UPDATE_SLA_DEFINITION = gql`
  mutation UpdateSLADefinition($updateSLADefinitionId: ID!, $input: UpdateSLADefinitionInput!) {
    updateSLADefinition(id: $updateSLADefinitionId, input: $input) {
      slaDefinition {
        id
      }
    }
  }
`

export const DELETE_SLA_DEFINITION = gql`
  mutation DeleteSLADefinition($deleteSLADefinitionId: ID!) {
    deleteSLADefinition(id: $deleteSLADefinitionId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_SLA_DEFINITION = gql`
  mutation CreateBulkCSVSLADefinition($input: Upload!) {
    createBulkCSVSLADefinition(input: $input) {
      slaDefinitions {
        id
      }
    }
  }
`

export const BULK_DELETE_SLA_DEFINITION = gql`
  mutation DeleteBulkSLADefinition($ids: [ID!]!) {
    deleteBulkSLADefinition(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_SLA_DEFINITION = gql`
  mutation UpdateBulkSLADefinition($ids: [ID!]!, $input: UpdateSLADefinitionInput!) {
    updateBulkSLADefinition(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

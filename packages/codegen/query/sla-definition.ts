import { gql } from 'graphql-request'

export const GET_ALL_SLA_DEFINITIONS = gql`
  query SlaDefinitionsWithFilter($where: SLADefinitionWhereInput, $orderBy: [SLADefinitionOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
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
  query SlaDefinition($slaDefinitionId: ID!) {
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
  mutation CreateSlaDefinition($input: CreateSLADefinitionInput!) {
    createSLADefinition(input: $input) {
      slaDefinition {
        id
      }
    }
  }
`

export const UPDATE_SLA_DEFINITION = gql`
  mutation UpdateSlaDefinition($updateSlaDefinitionId: ID!, $input: UpdateSLADefinitionInput!) {
    updateSLADefinition(id: $updateSlaDefinitionId, input: $input) {
      slaDefinition {
        id
      }
    }
  }
`

export const DELETE_SLA_DEFINITION = gql`
  mutation DeleteSlaDefinition($deleteSlaDefinitionId: ID!) {
    deleteSLADefinition(id: $deleteSlaDefinitionId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_SLA_DEFINITION = gql`
  mutation CreateBulkCSVSlaDefinition($input: Upload!) {
    createBulkCSVSLADefinition(input: $input) {
      slaDefinitions {
        id
      }
    }
  }
`

export const BULK_DELETE_SLA_DEFINITION = gql`
  mutation DeleteBulkSlaDefinition($ids: [ID!]!) {
    deleteBulkSLADefinition(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_SLA_DEFINITION = gql`
  mutation UpdateBulkSlaDefinition($ids: [ID!]!, $input: UpdateSLADefinitionInput!) {
    updateBulkSLADefinition(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

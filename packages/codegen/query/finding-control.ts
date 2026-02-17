import { gql } from 'graphql-request'

export const GET_ALL_FINDING_CONTROLS = gql`
  query FindingControlsWithFilter($where: FindingControlWhereInput, $orderBy: [FindingControlOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    findingControls(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          controlID
          createdAt
          createdBy
          discoveredAt
          externalControlID
          externalStandard
          externalStandardVersion
          findingID
          id
          metadata
          source
          standardID
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

export const FINDING_CONTROL = gql`
  query FindingControl($findingControlId: ID!) {
    findingControl(id: $findingControlId) {
      controlID
      createdAt
      createdBy
      discoveredAt
      externalControlID
      externalStandard
      externalStandardVersion
      findingID
      id
      metadata
      source
      standardID
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_FINDING_CONTROL = gql`
  mutation CreateFindingControl($input: CreateFindingControlInput!) {
    createFindingControl(input: $input) {
      findingControl {
        id
      }
    }
  }
`

export const UPDATE_FINDING_CONTROL = gql`
  mutation UpdateFindingControl($updateFindingControlId: ID!, $input: UpdateFindingControlInput!) {
    updateFindingControl(id: $updateFindingControlId, input: $input) {
      findingControl {
        id
      }
    }
  }
`

export const DELETE_FINDING_CONTROL = gql`
  mutation DeleteFindingControl($deleteFindingControlId: ID!) {
    deleteFindingControl(id: $deleteFindingControlId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_FINDING_CONTROL = gql`
  mutation CreateBulkCSVFindingControl($input: Upload!) {
    createBulkCSVFindingControl(input: $input) {
      findingControls {
        id
      }
    }
  }
`

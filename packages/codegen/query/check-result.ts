import { gql } from 'graphql-request'

export const GET_ALL_CHECK_RESULTS = gql`
  query CheckResultsWithFilter($where: CheckResultWhereInput, $orderBy: [CheckResultOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    checkResults(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          details
          externalURI
          id
          integrationID
          lastObservedAt
          parentExternalID
          source
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

export const CHECK_RESULT = gql`
  query CheckResult($checkResultId: ID!) {
    checkResult(id: $checkResultId) {
      createdAt
      createdBy
      details
      externalURI
      id
      integrationID
      lastObservedAt
      parentExternalID
      source
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_CHECK_RESULT = gql`
  mutation CreateCheckResult($input: CreateCheckResultInput!) {
    createCheckResult(input: $input) {
      checkResult {
        id
      }
    }
  }
`

export const UPDATE_CHECK_RESULT = gql`
  mutation UpdateCheckResult($updateCheckResultId: ID!, $input: UpdateCheckResultInput!) {
    updateCheckResult(id: $updateCheckResultId, input: $input) {
      checkResult {
        id
      }
    }
  }
`

export const DELETE_CHECK_RESULT = gql`
  mutation DeleteCheckResult($deleteCheckResultId: ID!) {
    deleteCheckResult(id: $deleteCheckResultId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_CHECK_RESULT = gql`
  mutation CreateBulkCSVCheckResult($input: Upload!) {
    createBulkCSVCheckResult(input: $input) {
      checkResults {
        id
      }
    }
  }
`

export const BULK_DELETE_CHECK_RESULT = gql`
  mutation DeleteBulkCheckResult($ids: [ID!]!) {
    deleteBulkCheckResult(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_CHECK_RESULT = gql`
  mutation UpdateBulkCheckResult($ids: [ID!]!, $input: UpdateCheckResultInput!) {
    updateBulkCheckResult(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

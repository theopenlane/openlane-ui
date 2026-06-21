import { gql } from 'graphql-request'

export const GET_ALL_POLICY_SUMMARIES = gql`
  query PolicySummarysWithFilter($where: PolicySummaryWhereInput, $orderBy: [PolicySummaryOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    policySummaries(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
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

export const POLICY_SUMMARY = gql`
  query PolicySummary($policySummaryId: ID!) {
    policySummary(id: $policySummaryId) {
      id
      name
    }
  }
`

export const CREATE_POLICY_SUMMARY = gql`
  mutation CreatePolicySummary($input: CreatePolicySummaryInput!) {
    createPolicySummary(input: $input) {
      policySummary {
        id
      }
    }
  }
`

export const UPDATE_POLICY_SUMMARY = gql`
  mutation UpdatePolicySummary($updatePolicySummaryId: ID!, $input: UpdatePolicySummaryInput!) {
    updatePolicySummary(id: $updatePolicySummaryId, input: $input) {
      policySummary {
        id
      }
    }
  }
`

export const DELETE_POLICY_SUMMARY = gql`
  mutation DeletePolicySummary($deletePolicySummaryId: ID!) {
    deletePolicySummary(id: $deletePolicySummaryId) {
      deletedID
    }
  }
`

export const BULK_DELETE_POLICY_SUMMARY = gql`
  mutation DeleteBulkPolicySummary($ids: [ID!]!) {
    deleteBulkPolicySummary(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_POLICY_SUMMARY = gql`
  mutation UpdateBulkPolicySummary($ids: [ID!]!, $input: UpdatePolicySummaryInput!) {
    updateBulkPolicySummary(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

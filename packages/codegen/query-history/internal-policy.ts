import { gql } from 'graphql-request'

export const GET_INTERNAL_POLICY_HISTORIES = gql`
  query GetInternalPolicyHistories($where: InternalPolicyHistoryWhereInput, $orderBy: InternalPolicyHistoryOrder, $first: Int, $after: Cursor) {
    internalPolicyHistories(where: $where, orderBy: $orderBy, first: $first, after: $after) {
      edges {
        node {
          id
          ref
          historyTime
          operation
          revision
          createdAt
          createdBy
          updatedAt
          updatedBy
          name
          status
          summary
          details
          detailsJSON
          tags
          approvalRequired
          reviewDue
          reviewFrequency
          approverID
          delegateID
          internalPolicyKindName
          environmentName
          scopeName
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`

import { gql } from 'graphql-request'

export const GET_FINDING_HISTORIES = gql`
  query GetFindingHistories($where: FindingHistoryWhereInput, $orderBy: FindingHistoryOrder, $first: Int, $after: Cursor) {
    findingHistories(where: $where, orderBy: $orderBy, first: $first, after: $after) {
      edges {
        node {
          id
          historyTime
          operation
          createdBy
          updatedBy
          internalOwner
          internalOwnerUserID
          internalOwnerGroupID
          internalOwnerIdentityHolderID
          assignedTo
          assignedToUserID
          assignedToGroupID
          assignedToIdentityHolderID
          reviewedBy
          reviewedByUserID
          reviewedByGroupID
          reviewedByIdentityHolderID
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

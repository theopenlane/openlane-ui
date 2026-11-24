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
          managedBy
          sourceDefinitionID
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

export const GET_FINDING_CREATION_HISTORY = gql`
  query GetFindingCreationHistory($where: FindingHistoryWhereInput) {
    findingHistories(where: $where, first: 1) {
      edges {
        node {
          id
          managedBy
          sourceDefinitionID
        }
      }
    }
  }
`

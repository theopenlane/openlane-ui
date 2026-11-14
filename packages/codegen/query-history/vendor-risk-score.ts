import { gql } from 'graphql-request'

export const GET_VENDOR_RISK_SCORE_HISTORIES = gql`
  query GetVendorRiskScoreHistories($where: VendorRiskScoreHistoryWhereInput, $first: Int, $after: Cursor) {
    vendorRiskScoreHistories(where: $where, first: $first, after: $after, orderBy: { field: history_time, direction: DESC }) {
      edges {
        node {
          id
          ref
          historyTime
          operation
          answer
          answerType
          likelihood
          impact
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

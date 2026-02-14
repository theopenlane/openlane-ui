import { gql } from 'graphql-request'

export const GET_ALL_NARRATIVES = gql`
  query NarrativesWithFilter($where: NarrativeWhereInput, $orderBy: [NarrativeOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    narratives(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          description
          details
          displayID
          id
          name
          systemOwned
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

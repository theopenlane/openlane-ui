import { gql } from 'graphql-request'

export const GET_FILES = gql`
  query GetFiles($where: FileWhereInput, $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    files(where: $where, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
      edges {
        node {
          id
          providedFileName
          providedFileSize
          presignedURL
          providedFileExtension
          categoryType
          createdAt
        }
      }
    }
  }
`

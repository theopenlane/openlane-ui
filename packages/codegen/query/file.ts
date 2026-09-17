import { gql } from 'graphql-request'

export const GET_FILES = gql`
  query GetFiles($where: FileWhereInput, $orderBy: [FileOrder!], $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    files(where: $where, orderBy: $orderBy, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      edges {
        node {
          id
          name
          providedFileName
          providedFileSize
          providedFileExtension
          detectedMimeType
          presignedURL
          categoryName
          createdAt
        }
      }
    }
  }
`

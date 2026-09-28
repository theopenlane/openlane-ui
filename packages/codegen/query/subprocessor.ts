import { gql } from 'graphql-request'

export const CREATE_SUBPROCESSOR = gql`
  mutation CreateSubprocessor($input: CreateSubprocessorInput!, $logoFile: Upload) {
    createSubprocessor(input: $input, logoFile: $logoFile) {
      subprocessor {
        id
        name
        logoFile {
          base64
        }
        logoRemoteURL
      }
    }
  }
`

export const UPDATE_SUBPROCESSOR = gql`
  mutation UpdateSubprocessor($updateSubprocessorId: ID!, $input: UpdateSubprocessorInput!, $logoFile: Upload) {
    updateSubprocessor(id: $updateSubprocessorId, input: $input, logoFile: $logoFile) {
      subprocessor {
        id
      }
    }
  }
`

export const GET_SUBPROCESSORS = gql`
  query GetSubprocessors($where: SubprocessorWhereInput, $first: Int, $orderBy: [SubprocessorOrder!], $after: Cursor, $before: Cursor, $last: Int) {
    subprocessors(where: $where, first: $first, orderBy: $orderBy, after: $after, before: $before, last: $last) {
      edges {
        node {
          id
          name
          description
          logoFile {
            base64
          }
          logoRemoteURL
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
  }
`

export const DELETE_BULK_SUBPROCESSORS = gql`
  mutation DeleteBulkSubprocessors($ids: [ID!]!) {
    deleteBulkSubprocessor(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const GET_SUBPROCESSOR_CATALOG = gql`
  query GetSubprocessorCatalog($first: Int, $after: Cursor) {
    subprocessors(first: $first, after: $after, orderBy: [{ field: name, direction: ASC }]) {
      edges {
        node {
          id
          name
          systemOwned
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

export const CREATE_BULK_SUBPROCESSOR = gql`
  mutation CreateBulkSubprocessor($input: [CreateSubprocessorInput!]) {
    createBulkSubprocessor(input: $input) {
      subprocessors {
        id
        name
      }
    }
  }
`

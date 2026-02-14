import { gql } from 'graphql-request'

export const GET_ALL_DIRECTORY_SYNC_RUNS = gql`
  query DirectorySyncRunsWithFilter($where: DirectorySyncRunWhereInput, $orderBy: [DirectorySyncRunOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    directorySyncRuns(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          completedAt
          createdAt
          createdBy
          deltaCount
          displayID
          environmentID
          environmentName
          error
          fullCount
          id
          integrationID
          rawManifestFileID
          scopeID
          scopeName
          sourceCursor
          startedAt
          stats
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

export const DIRECTORY_SYNC_RUN = gql`
  query DirectorySyncRun($directorySyncRunId: ID!) {
    directorySyncRun(id: $directorySyncRunId) {
      completedAt
      createdAt
      createdBy
      deltaCount
      displayID
      environmentID
      environmentName
      error
      fullCount
      id
      integrationID
      rawManifestFileID
      scopeID
      scopeName
      sourceCursor
      startedAt
      stats
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_DIRECTORY_SYNC_RUN = gql`
  mutation CreateDirectorySyncRun($input: CreateDirectorySyncRunInput!) {
    createDirectorySyncRun(input: $input) {
      directorySyncRun {
        id
      }
    }
  }
`

export const UPDATE_DIRECTORY_SYNC_RUN = gql`
  mutation UpdateDirectorySyncRun($updateDirectorySyncRunId: ID!, $input: UpdateDirectorySyncRunInput!) {
    updateDirectorySyncRun(id: $updateDirectorySyncRunId, input: $input) {
      directorySyncRun {
        id
      }
    }
  }
`

export const DELETE_DIRECTORY_SYNC_RUN = gql`
  mutation DeleteDirectorySyncRun($deleteDirectorySyncRunId: ID!) {
    deleteDirectorySyncRun(id: $deleteDirectorySyncRunId) {
      deletedID
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_JOB_RESULTS = gql`
  query JobResultsWithFilter($where: JobResultWhereInput, $orderBy: [JobResultOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    jobResults(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          exitCode
          fileID
          finishedAt
          id
          log
          scheduledJobID
          startedAt
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

export const JOB_RESULT = gql`
  query JobResult($jobResultId: ID!) {
    jobResult(id: $jobResultId) {
      createdAt
      createdBy
      exitCode
      fileID
      finishedAt
      id
      log
      scheduledJobID
      startedAt
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_JOB_RESULT = gql`
  mutation CreateJobResult($input: CreateJobResultInput!) {
    createJobResult(input: $input) {
      jobResult {
        id
      }
    }
  }
`

export const UPDATE_JOB_RESULT = gql`
  mutation UpdateJobResult($updateJobResultId: ID!, $input: UpdateJobResultInput!) {
    updateJobResult(id: $updateJobResultId, input: $input) {
      jobResult {
        id
      }
    }
  }
`

export const DELETE_JOB_RESULT = gql`
  mutation DeleteJobResult($deleteJobResultId: ID!) {
    deleteJobResult(id: $deleteJobResultId) {
      deletedID
    }
  }
`

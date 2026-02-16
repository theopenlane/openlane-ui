import { gql } from 'graphql-request'

export const GET_ALL_JOB_RUNNER_REGISTRATION_TOKENS = gql`
  query JobRunnerRegistrationTokensWithFilter($where: JobRunnerRegistrationTokenWhereInput, $orderBy: [JobRunnerRegistrationTokenOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    jobRunnerRegistrationTokens(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          expiresAt
          id
          jobRunnerID
          lastUsedAt
          token
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

export const JOB_RUNNER_REGISTRATION_TOKEN = gql`
  query JobRunnerRegistrationToken($jobRunnerRegistrationTokenId: ID!) {
    jobRunnerRegistrationToken(id: $jobRunnerRegistrationTokenId) {
      createdAt
      createdBy
      expiresAt
      id
      jobRunnerID
      lastUsedAt
      token
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_JOB_RUNNER_REGISTRATION_TOKEN = gql`
  mutation CreateJobRunnerRegistrationToken($input: CreateJobRunnerRegistrationTokenInput!) {
    createJobRunnerRegistrationToken(input: $input) {
      jobRunnerRegistrationToken {
        id
      }
    }
  }
`

export const DELETE_JOB_RUNNER_REGISTRATION_TOKEN = gql`
  mutation DeleteJobRunnerRegistrationToken($deleteJobRunnerRegistrationTokenId: ID!) {
    deleteJobRunnerRegistrationToken(id: $deleteJobRunnerRegistrationTokenId) {
      deletedID
    }
  }
`

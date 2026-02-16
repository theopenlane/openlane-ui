import { gql } from 'graphql-request'

export const GET_ALL_JOB_RUNNERS = gql`
  query JobRunnersWithFilter($where: JobRunnerWhereInput, $orderBy: [JobRunnerOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    jobRunners(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          displayID
          id
          ipAddress
          lastSeen
          name
          os
          systemOwned
          updatedAt
          updatedBy
          version
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

export const JOB_RUNNER = gql`
  query JobRunner($jobRunnerId: ID!) {
    jobRunner(id: $jobRunnerId) {
      createdAt
      createdBy
      displayID
      id
      ipAddress
      lastSeen
      name
      os
      systemOwned
      updatedAt
      updatedBy
      version
    }
  }
`

export const CREATE_JOB_RUNNER = gql`
  mutation CreateJobRunner($input: CreateJobRunnerInput!) {
    createJobRunner(input: $input) {
      jobRunner {
        id
      }
    }
  }
`

export const UPDATE_JOB_RUNNER = gql`
  mutation UpdateJobRunner($updateJobRunnerId: ID!, $input: UpdateJobRunnerInput!) {
    updateJobRunner(id: $updateJobRunnerId, input: $input) {
      jobRunner {
        id
      }
    }
  }
`

export const DELETE_JOB_RUNNER = gql`
  mutation DeleteJobRunner($deleteJobRunnerId: ID!) {
    deleteJobRunner(id: $deleteJobRunnerId) {
      deletedID
    }
  }
`

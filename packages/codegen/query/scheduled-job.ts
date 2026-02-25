import { gql } from 'graphql-request'

export const GET_ALL_SCHEDULED_JOBS = gql`
  query ScheduledJobsWithFilter($where: ScheduledJobWhereInput, $orderBy: [ScheduledJobOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    scheduledJobs(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          active
          configuration
          createdAt
          createdBy
          cron
          displayID
          id
          jobID
          jobRunnerID
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

export const SCHEDULED_JOB = gql`
  query ScheduledJob($scheduledJobId: ID!) {
    scheduledJob(id: $scheduledJobId) {
      active
      configuration
      createdAt
      createdBy
      cron
      displayID
      id
      jobID
      jobRunnerID
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_SCHEDULED_JOB = gql`
  mutation CreateScheduledJob($input: CreateScheduledJobInput!) {
    createScheduledJob(input: $input) {
      scheduledJob {
        id
      }
    }
  }
`

export const UPDATE_SCHEDULED_JOB = gql`
  mutation UpdateScheduledJob($updateScheduledJobId: ID!, $input: UpdateScheduledJobInput!) {
    updateScheduledJob(id: $updateScheduledJobId, input: $input) {
      scheduledJob {
        id
      }
    }
  }
`

export const DELETE_SCHEDULED_JOB = gql`
  mutation DeleteScheduledJob($deleteScheduledJobId: ID!) {
    deleteScheduledJob(id: $deleteScheduledJobId) {
      deletedID
    }
  }
`

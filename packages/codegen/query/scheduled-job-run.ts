import { gql } from 'graphql-request'

export const GET_ALL_SCHEDULED_JOB_RUNS = gql`
  query ScheduledJobRunsWithFilter($where: ScheduledJobRunWhereInput, $orderBy: [ScheduledJobRunOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    scheduledJobRuns(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          createdAt
          createdBy
          expectedExecutionTime
          id
          jobRunnerID
          scheduledJobID
          script
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

export const SCHEDULED_JOB_RUN = gql`
  query ScheduledJobRun($scheduledJobRunId: ID!) {
    scheduledJobRun(id: $scheduledJobRunId) {
      createdAt
      createdBy
      expectedExecutionTime
      id
      jobRunnerID
      scheduledJobID
      script
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_SCHEDULED_JOB_RUN = gql`
  mutation CreateScheduledJobRun($input: CreateScheduledJobRunInput!) {
    createScheduledJobRun(input: $input) {
      scheduledJobRun {
        id
      }
    }
  }
`

export const UPDATE_SCHEDULED_JOB_RUN = gql`
  mutation UpdateScheduledJobRun($updateScheduledJobRunId: ID!, $input: UpdateScheduledJobRunInput!) {
    updateScheduledJobRun(id: $updateScheduledJobRunId, input: $input) {
      scheduledJobRun {
        id
      }
    }
  }
`

export const DELETE_SCHEDULED_JOB_RUN = gql`
  mutation DeleteScheduledJobRun($deleteScheduledJobRunId: ID!) {
    deleteScheduledJobRun(id: $deleteScheduledJobRunId) {
      deletedID
    }
  }
`

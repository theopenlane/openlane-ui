import { gql } from 'graphql-request'

export const GET_ALL_JOB_TEMPLATES = gql`
  query JobTemplatesWithFilter($where: JobTemplateWhereInput, $orderBy: [JobTemplateOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    jobTemplates(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          configuration
          createdAt
          createdBy
          cron
          description
          displayID
          downloadURL
          id
          systemOwned
          title
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

export const JOB_TEMPLATE = gql`
  query JobTemplate($jobTemplateId: ID!) {
    jobTemplate(id: $jobTemplateId) {
      configuration
      createdAt
      createdBy
      cron
      description
      displayID
      downloadURL
      id
      systemOwned
      title
      updatedAt
      updatedBy
    }
  }
`

export const CREATE_JOB_TEMPLATE = gql`
  mutation CreateJobTemplate($input: CreateJobTemplateInput!) {
    createJobTemplate(input: $input) {
      jobTemplate {
        id
      }
    }
  }
`

export const UPDATE_JOB_TEMPLATE = gql`
  mutation UpdateJobTemplate($updateJobTemplateId: ID!, $input: UpdateJobTemplateInput!) {
    updateJobTemplate(id: $updateJobTemplateId, input: $input) {
      jobTemplate {
        id
      }
    }
  }
`

export const DELETE_JOB_TEMPLATE = gql`
  mutation DeleteJobTemplate($deleteJobTemplateId: ID!) {
    deleteJobTemplate(id: $deleteJobTemplateId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_JOB_TEMPLATE = gql`
  mutation CreateBulkCSVJobTemplate($input: Upload!) {
    createBulkCSVJobTemplate(input: $input) {
      jobTemplates {
        id
      }
    }
  }
`

export const BULK_DELETE_JOB_TEMPLATE = gql`
  mutation DeleteBulkJobTemplate($ids: [ID!]!) {
    deleteBulkJobTemplate(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_JOB_TEMPLATE = gql`
  mutation UpdateBulkJobTemplate($ids: [ID!]!, $input: UpdateJobTemplateInput!) {
    updateBulkJobTemplate(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

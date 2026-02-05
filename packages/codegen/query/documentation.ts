import { gql } from 'graphql-request'

export const GET_DOCUMENTATION_POLICIES = gql`
  query GetDocumentationPolicies($where: InternalPolicyWhereInput, $orderBy: [InternalPolicyOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    internalPolicies(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          updatedAt
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

export const GET_DOCUMENTATION_PROCEDURES = gql`
  query GetDocumentationProcedures($where: ProcedureWhereInput, $orderBy: [ProcedureOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    procedures(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          updatedAt
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

export const GET_DOCUMENTATION_TASKS = gql`
  query GetDocumentationTasks($where: TaskWhereInput, $orderBy: [TaskOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    tasks(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          title
          taskKindName
          status
          due
          updatedAt
          assignee {
            id
            displayName
            avatarRemoteURL
            avatarFile {
              presignedURL
            }
          }
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

export const GET_DOCUMENTATION_PROGRAMS = gql`
  query GetDocumentationPrograms($where: ProgramWhereInput, $orderBy: [ProgramOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    programs(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          updatedAt
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

export const GET_DOCUMENTATION_RISKS = gql`
  query GetDocumentationRisks($where: RiskWhereInput, $orderBy: [RiskOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    risks(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          updatedAt
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

import { gql } from 'graphql-request'

export const TASKS_WITH_FILTER = gql`
  query TasksWithFilter($where: TaskWhereInput, $orderBy: [TaskOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    tasks(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          title
          status
          tags
          due
          displayID
          category
          details
          updatedAt
          updatedBy
          createdAt
          createdBy
          category
          completed
          assigner {
            displayName
            avatarRemoteURL
            avatarFile {
              presignedURL
            }
          }
          assignee {
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
      totalCount
    }
  }
`

export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      task {
        id
      }
    }
  }
`

export const UPDATE_TASK = gql`
  mutation UpdateTask($updateTaskId: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $updateTaskId, input: $input) {
      task {
        id
      }
    }
  }
`

export const DELETE_TASK = gql`
  mutation DeleteTask($deleteTaskId: ID!) {
    deleteTask(id: $deleteTaskId) {
      deletedID
    }
  }
`

export const TASK = gql`
  query Task($taskId: ID!) {
    task(id: $taskId) {
      tags
      assignee {
        displayName
        avatarRemoteURL
        id
      }
      assigner {
        avatarRemoteURL
        displayName
        id
      }
      id
      category
      title
      status
      subcontrols {
        edges {
          node {
            id
            refCode
            controlID
            description
            displayID
          }
        }
      }
      controls {
        edges {
          node {
            id
            refCode
            description
            displayID
          }
        }
      }
      risks {
        edges {
          node {
            id
            name
            details
            displayID
          }
        }
      }
      programs {
        edges {
          node {
            id
            displayID
            description
            name
          }
        }
      }
      procedures {
        edges {
          node {
            id
            displayID
            name
            summary
          }
        }
      }
      internalPolicies {
        edges {
          node {
            id
            displayID
            name
            summary
          }
        }
      }
      evidence {
        edges {
          node {
            displayID
            id
            description
            name
          }
        }
      }
      groups {
        edges {
          node {
            displayID
            id
            description
            name
          }
        }
      }
      due
      displayID
      details
      controlObjectives {
        edges {
          node {
            displayID
            id
            name
            desiredOutcome
            controls {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
      comments {
        edges {
          node {
            id
            createdAt
            createdBy
            owner {
              avatarRemoteURL
              avatarFile {
                presignedURL
              }
              displayName
            }
            text
          }
        }
      }
    }
  }
`

export const CREATE_CSV_BULK_TASK = gql`
  mutation CreateBulkCSVTask($input: Upload!) {
    createBulkCSVTask(input: $input) {
      tasks {
        id
      }
    }
  }
`

export const USER_TASKS = gql`
  query UserTasks($where: TaskWhereInput) {
    tasks(where: $where) {
      edges {
        node {
          id
          displayID
          title
          due
        }
      }
    }
  }
`

export const BULK_EDIT_TASK = gql`
  mutation UpdateBulkTask($ids: [ID!]!, $input: UpdateTaskInput!) {
    updateBulkTask(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const UPDATE_TASK_COMMENT = gql`
  mutation UpdateTaskComment($updateTaskCommentId: ID!, $input: UpdateNoteInput!) {
    updateTaskComment(id: $updateTaskCommentId, input: $input) {
      task {
        id
      }
    }
  }
`

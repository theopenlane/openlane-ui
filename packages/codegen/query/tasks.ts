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
          }
        }
      }
      controls {
        edges {
          node {
            id
            refCode
          }
        }
      }
      risks {
        edges {
          node {
            id
            name
          }
        }
      }
      programs {
        edges {
          node {
            id
            displayID
          }
        }
      }
      procedures {
        edges {
          node {
            id
            displayID
          }
        }
      }
      internalPolicies {
        edges {
          node {
            id
            displayID
          }
        }
      }
      evidence {
        edges {
          node {
            displayID
            id
          }
        }
      }
      groups {
        edges {
          node {
            displayID
            id
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
          }
        }
      }
      comments {
        edges {
          node {
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

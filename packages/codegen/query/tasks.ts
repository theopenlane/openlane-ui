import { gql } from 'graphql-request'

export const TASKS_WITH_FILTER = gql`
  query TasksWithFilter($where: TaskWhereInput) {
    tasks(where: $where) {
      edges {
        node {
          id
          title
          description
          status
          tags
          details
          due
          displayID
          category
          assigner {
            displayName
            firstName
            lastName
            avatarRemoteURL
            avatarFile {
              presignedURL
            }
          }
        }
      }
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
        firstName
        lastName
        avatarRemoteURL
        id
      }
      assigner {
        avatarRemoteURL
        lastName
        firstName
        displayName
        id
      }
      id
      category
      title
      status
      subcontrol {
        edges {
          node {
            id
            displayID
          }
        }
      }
      program {
        edges {
          node {
            id
            displayID
          }
        }
      }
      procedure {
        edges {
          node {
            id
            displayID
          }
        }
      }
      internalPolicy {
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
      group {
        edges {
          node {
            displayID
            id
          }
        }
      }
      due
      displayID
      description
      details
      controlObjective {
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

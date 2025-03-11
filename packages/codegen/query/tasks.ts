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
        displayID
        id
      }
      program {
        displayID
        id
      }
      procedure {
        displayID
        id
      }
      internalPolicy {
        displayID
        id
      }
      evidence {
        displayID
        id
      }
      group {
        displayID
        id
      }
      due
      displayID
      description
      details
      controlObjective {
        displayID
        id
      }
      comments {
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
`

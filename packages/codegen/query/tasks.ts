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
        }
      }
    }
  }
`

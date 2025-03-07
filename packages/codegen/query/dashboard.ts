import { gql } from 'graphql-request'

export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($where: TaskWhereInput) {
    programs {
      edges {
        node {
          id
          name
          description
          controls {
            id
          }
          tasks {
            id
            title
            status
            description
            due
          }
        }
      }
    }
    tasks(where: $where) {
      edges {
        node {
          id
          title
          status
          due
          tags
        }
      }
    }
    organizations {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`

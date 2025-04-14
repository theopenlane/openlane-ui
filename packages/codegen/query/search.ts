import { gql } from 'graphql-request'

export const SEARCH = gql`
  query Searchquery($query: String!) {
    search(query: $query) {
      programs {
        edges {
          node {
            id
            name
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      organizations {
        edges {
          node {
            id
            name
            displayName
            avatarRemoteURL
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      controlObjectives {
        edges {
          node {
            id
            name
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      controls {
        edges {
          node {
            id
            refCode
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      subcontrols {
        edges {
          node {
            id
            refCode
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      risks {
        edges {
          node {
            id
            name
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      groups {
        edges {
          node {
            id
            name
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }

      tasks {
        edges {
          node {
            id
            title
          }
        }
        pageInfo {
          endCursor
          startCursor
        }
        totalCount
      }
    }
  }
`

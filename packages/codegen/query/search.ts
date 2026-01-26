import { gql } from 'graphql-request'

export const SEARCH = gql`
  query Search($query: String!) {
    search(query: $query) {
      programs {
        edges {
          node {
            __typename
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
            __typename
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

      controls {
        edges {
          node {
            __typename
            id
            refCode
            ownerID
            standardID
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
            __typename
            id
            refCode
            ownerID
            control {
              id
            }
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
            __typename
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
            __typename
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
            __typename
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

      internalPolicies {
        edges {
          node {
            __typename
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

      procedures {
        edges {
          node {
            __typename
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
    }
  }
`

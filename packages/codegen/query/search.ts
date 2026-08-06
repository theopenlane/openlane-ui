import { gql } from 'graphql-request'

export const SEARCH = gql`
  query Search($query: String!) {
    search(query: $query) {
      searchContext {
        entityID
        entityType
        matchedFields
        snippets {
          field
          text
        }
      }
      controls {
        edges {
          node {
            id
            refCode
            ownerID
            standardID
            isTrustCenterControl
            systemOwned
            standard {
              framework
            }
          }
        }
      }
      subcontrols {
        edges {
          node {
            id
            refCode
            systemOwned
            control {
              id
              isTrustCenterControl
              standard {
                framework
              }
            }
          }
        }
      }
      internalPolicies {
        edges {
          node {
            id
            name
          }
        }
      }
      procedures {
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
            name
          }
        }
      }
      tasks {
        edges {
          node {
            id
            title
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
      groups {
        edges {
          node {
            id
            displayName
            name
          }
        }
      }
      organizations {
        edges {
          node {
            id
            displayName
            name
          }
        }
      }
      standards {
        edges {
          node {
            id
            name
            shortName
            framework
            systemOwned
          }
        }
      }
      templates {
        edges {
          node {
            id
            name
          }
        }
      }
      evidences {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  }
`

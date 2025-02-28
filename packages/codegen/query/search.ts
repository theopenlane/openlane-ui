import { gql } from 'graphql-request'

export const SEARCH = gql`
  query Search($query: String!) {
    search(query: $query) {
      totalCount
      nodes {
        ... on ProgramSearchResult {
          programs {
            id
            name
          }
        }
        ... on OrganizationSearchResult {
          organizations {
            id
            name
            displayName
            avatarRemoteURL
          }
        }
        ... on ControlObjectiveSearchResult {
          controlObjectives {
            id
            name
          }
        }
        ... on ControlSearchResult {
          controls {
            id
            name
          }
        }
        ... on SubcontrolSearchResult {
          subcontrols {
            id
            name
          }
        }
        ... on RiskSearchResult {
          risks {
            id
            name
          }
        }
        ... on GroupSearchResult {
          groups {
            id
            name
          }
        }
        ... on TaskSearchResult {
          tasks {
            id
            title
          }
        }
      }
    }
  }
`

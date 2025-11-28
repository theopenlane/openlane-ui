import { gql } from 'graphql-request'

export const GET_TAGS = gql`
  query GetTags {
    tagDefinitions {
      edges {
        node {
          id
          name
          color
        }
      }
    }
  }
`

import { gql } from 'graphql-request'

export const GET_ALL_NARRATIVES = gql`
  query GetAllNarratives($where: NarrativeWhereInput) {
    narratives(where: $where) {
      edges {
        node {
          id
          name
          displayID
        }
      }
    }
  }
`

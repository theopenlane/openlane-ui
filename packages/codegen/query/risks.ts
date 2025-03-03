import { gql } from 'graphql-request'

export const GET_ALL_RISKS = gql`
  query GetAllRisks {
    risks {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`

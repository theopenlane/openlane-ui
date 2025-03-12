import { gql } from 'graphql-request'

export const GET_ALL_RISKS = gql`
  query GetAllRisks {
    risks {
      edges {
        node {
          id
          displayID
          name
          businessCosts
          likelihood
          impact
          control {
            id
            refCode
          }
        }
      }
    }
  }
`

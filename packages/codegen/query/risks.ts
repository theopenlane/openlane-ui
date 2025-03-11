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
export const RISKS_NOT_MITIGATED = gql`
  query RisksNotMitigated($where: RiskWhereInput) {
    risks(where: $where) {
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

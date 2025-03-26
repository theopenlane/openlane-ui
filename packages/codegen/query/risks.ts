import { gql } from 'graphql-request'

const RISK_FIELDS_FRAGMENT = gql`
  fragment RiskFields on Risk {
    id
    displayID
    name
    details
    tags
    category
    riskType
    score
    status
    businessCosts
    likelihood
    impact
    controls {
      edges {
        node {
          id
          refCode
        }
      }
    }
  }
`

export const GET_ALL_RISKS = gql`
  ${RISK_FIELDS_FRAGMENT}
  query GetAllRisks {
    risks {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          ...RiskFields
        }
      }
    }
  }
`

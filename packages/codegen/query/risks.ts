import { gql } from 'graphql-request'

const RISK_FIELDS = `
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
  mitigation
  controls {
    edges {
      node {
        id
        refCode
      }
    }
  }
`

export const GET_ALL_RISKS = gql`
  query GetAllRisks {
    risks {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          ${RISK_FIELDS}
        }
      }
    }
  }
`

export const GET_RISK_BY_ID = gql`
  query GetRiskByID($riskId: ID!) {
    risk(id: $riskId) {
      ${RISK_FIELDS}
    }
  }
`

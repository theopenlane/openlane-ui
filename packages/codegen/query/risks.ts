import { gql } from 'graphql-request'

const RISK_FIELDS = gql`
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
    mitigation
    stakeholder {
      displayName
      logoURL
      gravatarLogoURL
    }
    controls {
      edges {
        node {
          id
          refCode
        }
      }
    }
    subcontrols {
      edges {
        node {
          id
          refCode
        }
      }
    }
  }
`

export const GET_RISK_BY_ID = gql`
  query GetRiskByID($riskId: ID!) {
    risk(id: $riskId) {
      ...RiskFields
    }
  }
  ${RISK_FIELDS}
`

export const GET_ALL_RISKS = gql`
  query GetAllRisks($where: RiskWhereInput, $orderBy: [RiskOrder!]) {
    risks(where: $where, orderBy: $orderBy) {
      totalCount
      pageInfo {
        endCursor
        startCursor
      }
      edges {
        node {
          ...RiskFields
        }
      }
    }
  }

  ${RISK_FIELDS}
`

export const UPDATE_RISK = gql`
  mutation UpdateRisk($id: ID!, $input: UpdateRiskInput!) {
    updateRisk(id: $id, input: $input) {
      risk {
        id
      }
    }
  }
`

export const CREATE_CSV_BULK_RISK = gql`
  mutation CreateBulkCSVRisk($input: Upload!) {
    createBulkCSVRisk(input: $input) {
      risks {
        id
      }
    }
  }
`

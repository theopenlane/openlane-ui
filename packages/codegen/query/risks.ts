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
      id
      displayName
      gravatarLogoURL
      logoURL
    }
    delegate {
      id
      displayName
      gravatarLogoURL
      logoURL
    }
    stakeholder {
      displayName
      logoURL
      gravatarLogoURL
    }
    procedures {
      edges {
        node {
          id
          name
          displayID
          summary
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    controls {
      edges {
        node {
          id
          displayID
          refCode
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    subcontrols {
      edges {
        node {
          id
          displayID
          refCode
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    programs {
      edges {
        node {
          id
          displayID
          name
          description
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    tasks {
      edges {
        node {
          id
          displayID
          title
          details
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
    }
    internalPolicies {
      edges {
        node {
          id
          displayID
          name
        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
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
  query GetAllRisks($where: RiskWhereInput, $orderBy: [RiskOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    risks(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
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

export const DELETE_RISK = gql`
  mutation DeleteRisk($deleteRiskId: ID!) {
    deleteRisk(id: $deleteRiskId) {
      deletedID
    }
  }
`

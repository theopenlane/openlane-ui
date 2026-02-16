import { gql } from 'graphql-request'

export const GET_ALL_FINDINGS = gql`
  query FindingsWithFilter($where: FindingWhereInput, $orderBy: [FindingOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    findings(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          assessmentID
          blocksProduction
          category
          createdAt
          createdBy
          description
          displayID
          displayName
          environmentID
          environmentName
          eventTime
          exploitability
          externalID
          externalOwnerID
          externalURI
          findingClass
          id
          impact
          metadata
          numericSeverity
          open
          priority
          production
          public
          rawPayload
          recommendation
          recommendedActions
          remediationSLA
          reportedAt
          resourceName
          scopeID
          scopeName
          score
          severity
          source
          sourceUpdatedAt
          state
          status
          systemOwned
          targetDetails
          updatedAt
          updatedBy
          validated
          vector
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`

export const FINDING = gql`
  query Finding($findingId: ID!) {
    finding(id: $findingId) {
      assessmentID
      blocksProduction
      category
      createdAt
      createdBy
      description
      displayID
      displayName
      environmentID
      environmentName
      eventTime
      exploitability
      externalID
      externalOwnerID
      externalURI
      findingClass
      id
      impact
      metadata
      numericSeverity
      open
      priority
      production
      public
      rawPayload
      recommendation
      recommendedActions
      remediationSLA
      reportedAt
      resourceName
      scopeID
      scopeName
      score
      severity
      source
      sourceUpdatedAt
      state
      status
      systemOwned
      targetDetails
      updatedAt
      updatedBy
      validated
      vector
    }
  }
`

export const CREATE_FINDING = gql`
  mutation CreateFinding($input: CreateFindingInput!) {
    createFinding(input: $input) {
      finding {
        id
      }
    }
  }
`

export const UPDATE_FINDING = gql`
  mutation UpdateFinding($updateFindingId: ID!, $input: UpdateFindingInput!) {
    updateFinding(id: $updateFindingId, input: $input) {
      finding {
        id
      }
    }
  }
`

export const DELETE_FINDING = gql`
  mutation DeleteFinding($deleteFindingId: ID!) {
    deleteFinding(id: $deleteFindingId) {
      deletedID
    }
  }
`

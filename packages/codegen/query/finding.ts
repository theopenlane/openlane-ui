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

export const CREATE_CSV_BULK_FINDING = gql`
  mutation CreateBulkCSVFinding($input: Upload!) {
    createBulkCSVFinding(input: $input) {
      findings {
        id
      }
    }
  }
`

export const BULK_DELETE_FINDING = gql`
  mutation DeleteBulkFinding($ids: [ID!]!) {
    deleteBulkFinding(ids: $ids) {
      deletedIDs
    }
  }
`

export const GET_FINDING_ASSOCIATIONS = gql`
  query GetFindingAssociations($findingId: ID!) {
    finding(id: $findingId) {
      controls {
        edges {
          node {
            id
            refCode
            description
            displayID
          }
        }
        totalCount
      }
      subcontrols {
        edges {
          node {
            id
            refCode
            displayID
          }
        }
        totalCount
      }
      risks {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      programs {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      tasks {
        edges {
          node {
            id
            title
            displayID
          }
        }
        totalCount
      }
      assets {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      scans {
        edges {
          node {
            id
            target
          }
        }
        totalCount
      }
      remediations {
        edges {
          node {
            id
            title
            displayID
          }
        }
        totalCount
      }
      reviews {
        edges {
          node {
            id
            title
          }
        }
        totalCount
      }
      vulnerabilities {
        edges {
          node {
            id
            displayName
            displayID
          }
        }
        totalCount
      }
    }
  }
`

export const BULK_EDIT_FINDING = gql`
  mutation UpdateBulkFinding($ids: [ID!]!, $input: UpdateFindingInput!) {
    updateBulkFinding(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

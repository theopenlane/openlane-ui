import { gql } from 'graphql-request'

const INTEGRATION_RUN_SUMMARY_FIELDS = gql`
  fragment IntegrationRunSummaryFields on IntegrationRun {
    id
    integrationID
    operationName
    operationKind
    runType
    status
    createdAt
    startedAt
    finishedAt
    durationMs
    summary
    error
  }
`

const INTEGRATION_RUN_FIELDS = gql`
  ${INTEGRATION_RUN_SUMMARY_FIELDS}
  fragment IntegrationRunFields on IntegrationRun {
    ...IntegrationRunSummaryFields
    metrics
  }
`

export const GET_INTEGRATION_RUN_SUMMARIES = gql`
  ${INTEGRATION_RUN_SUMMARY_FIELDS}
  query GetIntegrationRunSummaries($where: IntegrationRunWhereInput, $orderBy: IntegrationRunOrder, $first: Int) {
    integrationRuns(where: $where, orderBy: $orderBy, first: $first) {
      edges {
        node {
          ...IntegrationRunSummaryFields
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUNS = gql`
  ${INTEGRATION_RUN_FIELDS}
  query GetIntegrationRuns($where: IntegrationRunWhereInput, $orderBy: IntegrationRunOrder, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          ...IntegrationRunFields
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_STATS = gql`
  query GetIntegrationRunStats($totalWhere: IntegrationRunWhereInput, $failedWhere: IntegrationRunWhereInput, $lastSuccessWhere: IntegrationRunWhereInput) {
    total: integrationRuns(where: $totalWhere, first: 1) {
      totalCount
    }
    failed: integrationRuns(where: $failedWhere, first: 1) {
      totalCount
    }
    lastSuccess: integrationRuns(where: $lastSuccessWhere, first: 1, orderBy: { field: FINISHED_AT, direction: DESC }) {
      edges {
        node {
          id
          integrationID
          operationName
          finishedAt
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN = gql`
  ${INTEGRATION_RUN_FIELDS}
  query GetIntegrationRun($integrationRunId: ID!) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          ...IntegrationRunFields
          actionPlans {
            totalCount
          }
          assets {
            totalCount
          }
          checkResults {
            totalCount
          }
          contacts {
            totalCount
          }
          directoryAccounts {
            totalCount
          }
          directoryGroups {
            totalCount
          }
          directoryMemberships {
            totalCount
          }
          entities {
            totalCount
          }
          findings {
            totalCount
          }
          internalPolicies {
            totalCount
          }
          procedures {
            totalCount
          }
          risks {
            totalCount
          }
          vulnerabilities {
            totalCount
          }
        }
      }
    }
  }
`

const RUN_RECORD_PAGE_INFO = gql`
  fragment IntegrationRunRecordPageInfo on PageInfo {
    startCursor
    endCursor
    hasNextPage
    hasPreviousPage
  }
`

export const GET_INTEGRATION_RUN_ACTION_PLANS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunActionPlans($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          actionPlans(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                name
                status
                externalID
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_ASSETS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunAssets($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          assets(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                name
                displayName
                assetType
                identifier
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_CHECK_RESULTS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunCheckResults($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          checkResults(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                source
                status
                sourceKey
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_CONTACTS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunContacts($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          contacts(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                fullName
                email
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_DIRECTORY_ACCOUNTS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunDirectoryAccounts($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          directoryAccounts(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayName
                canonicalEmail
                externalID
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_DIRECTORY_GROUPS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunDirectoryGroups($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          directoryGroups(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayName
                email
                externalID
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_DIRECTORY_MEMBERSHIPS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunDirectoryMemberships($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          directoryMemberships(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayID
                role
                updatedAt
                directoryAccount {
                  id
                  displayName
                  canonicalEmail
                }
                directoryGroup {
                  id
                  displayName
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_ENTITIES = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunEntities($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          entities(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                name
                displayName
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_FINDINGS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunFindings($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          findings(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayID
                displayName
                externalID
                category
                severity
                resourceName
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_INTERNAL_POLICIES = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunInternalPolicies($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          internalPolicies(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayID
                name
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_PROCEDURES = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunProcedures($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          procedures(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayID
                name
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_RISKS = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunRisks($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          risks(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayID
                name
                status
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INTEGRATION_RUN_VULNERABILITIES = gql`
  ${RUN_RECORD_PAGE_INFO}
  query GetIntegrationRunVulnerabilities($integrationRunId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    integrationRuns(where: { id: $integrationRunId }, first: 1) {
      edges {
        node {
          id
          vulnerabilities(first: $first, after: $after, last: $last, before: $before) {
            totalCount
            pageInfo {
              ...IntegrationRunRecordPageInfo
            }
            edges {
              node {
                id
                displayID
                displayName
                cveID
                externalID
                severity
                category
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

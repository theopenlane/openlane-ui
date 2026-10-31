import { gql } from 'graphql-request'

export const GET_ALL_REMEDIATIONS = gql`
  query RemediationsWithFilter($where: RemediationWhereInput, $orderBy: [RemediationOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    remediations(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          completedAt
          createdAt
          createdBy
          displayID
          dueAt
          environmentID
          environmentName
          error
          explanation
          externalID
          externalOwnerID
          externalURI
          id
          instructions
          intent
          metadata
          ownerReference
          prGeneratedAt
          pullRequestURI
          repositoryURI
          scopeID
          scopeName
          source
          state
          status
          summary
          systemOwned
          ticketReference
          title
          updatedAt
          updatedBy
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

export const REMEDIATION = gql`
  query Remediation($remediationId: ID!) {
    remediation(id: $remediationId) {
      completedAt
      createdAt
      createdBy
      displayID
      dueAt
      environmentID
      environmentName
      error
      explanation
      externalID
      externalOwnerID
      externalURI
      id
      instructions
      intent
      metadata
      ownerReference
      prGeneratedAt
      pullRequestURI
      repositoryURI
      scopeID
      scopeName
      source
      state
      status
      summary
      systemOwned
      ticketReference
      title
      updatedAt
      updatedBy
      vulnerabilities(first: 1) {
        edges {
          node {
            id
          }
        }
      }
      findings(first: 1) {
        edges {
          node {
            id
          }
        }
      }
      risks(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`

export const CREATE_REMEDIATION = gql`
  mutation CreateRemediation($input: CreateRemediationInput!, $remediationFiles: [Upload!], $remediationFilesMetadata: [FileMetadataInput!]) {
    createRemediation(input: $input, remediationFiles: $remediationFiles, remediationFilesMetadata: $remediationFilesMetadata) {
      remediation {
        id
      }
    }
  }
`

export const UPDATE_REMEDIATION = gql`
  mutation UpdateRemediation($updateRemediationId: ID!, $input: UpdateRemediationInput!, $remediationFiles: [Upload!], $remediationFilesMetadata: [FileMetadataInput!]) {
    updateRemediation(id: $updateRemediationId, input: $input, remediationFiles: $remediationFiles, remediationFilesMetadata: $remediationFilesMetadata) {
      remediation {
        id
      }
    }
  }
`

export const DELETE_REMEDIATION = gql`
  mutation DeleteRemediation($deleteRemediationId: ID!) {
    deleteRemediation(id: $deleteRemediationId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_REMEDIATION = gql`
  mutation CreateBulkCSVRemediation($input: Upload!) {
    createBulkCSVRemediation(input: $input) {
      remediations {
        id
      }
    }
  }
`

export const BULK_DELETE_REMEDIATION = gql`
  mutation DeleteBulkRemediation($ids: [ID!]!) {
    deleteBulkRemediation(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const GET_REMEDIATION_ASSOCIATIONS = gql`
  query GetRemediationAssociations($remediationId: ID!) {
    remediation(id: $remediationId) {
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
      findings {
        edges {
          node {
            id
            displayName
            displayID
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

export const BULK_EDIT_REMEDIATION = gql`
  mutation UpdateBulkRemediation($ids: [ID!]!, $input: UpdateRemediationInput!) {
    updateBulkRemediation(ids: $ids, input: $input) {
      updatedIDs
      notUpdatedIDs
      error
    }
  }
`

export const GET_REMEDIATION_FILES_PAGINATED = gql`
  query GetRemediationFilesPaginated($remediationId: ID!, $after: Cursor, $first: Int, $before: Cursor, $last: Int, $orderBy: [FileOrder!]) {
    remediation(id: $remediationId) {
      files(after: $after, first: $first, before: $before, last: $last, orderBy: $orderBy) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
        edges {
          node {
            name
            providedFileName
            providedFileSize
            providedFileExtension
            categoryName
            id
            uri
            presignedURL
          }
        }
      }
    }
  }
`

export const GET_REMEDIATION_CONTEXT_SUBJECT = gql`
  query GetRemediationContextSubject($id: ID!, $withVulnerability: Boolean!, $withFinding: Boolean!, $withRisk: Boolean!) {
    vulnerability(id: $id) @include(if: $withVulnerability) {
      id
      displayID
      displayName
      cveID
      externalID
      description
      source
      severity
      securityLevel
      score
      environmentName
      scopeName
    }
    finding(id: $id) @include(if: $withFinding) {
      id
      displayID
      displayName
      description
      source
      severity
      securityLevel
      score
      environmentName
      scopeName
    }
    risk(id: $id) @include(if: $withRisk) {
      id
      displayID
      name
      details
      riskCategoryName
      impact
      score
      environmentName
      scopeName
    }
  }
`

export const GET_REMEDIATION_CONTEXT_OPTIONS = gql`
  query GetRemediationContextOptions(
    $vulnerabilityWhere: VulnerabilityWhereInput
    $findingWhere: FindingWhereInput
    $riskWhere: RiskWhereInput
    $withVulnerabilities: Boolean!
    $withFindings: Boolean!
    $withRisks: Boolean!
  ) {
    vulnerabilities(first: 20, where: $vulnerabilityWhere, orderBy: [{ field: updated_at, direction: DESC }]) @include(if: $withVulnerabilities) {
      edges {
        node {
          id
          displayID
          displayName
          cveID
          externalID
        }
      }
    }
    findings(first: 20, where: $findingWhere, orderBy: [{ field: updated_at, direction: DESC }]) @include(if: $withFindings) {
      edges {
        node {
          id
          displayID
          displayName
        }
      }
    }
    risks(first: 20, where: $riskWhere, orderBy: [{ field: updated_at, direction: DESC }]) @include(if: $withRisks) {
      edges {
        node {
          id
          displayID
          name
        }
      }
    }
  }
`

export const GET_REMEDIATION_FILE_IDS = gql`
  query GetRemediationFileIds($remediationId: ID!, $first: Int, $after: Cursor) {
    remediation(id: $remediationId) {
      files(first: $first, after: $after) {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          node {
            id
          }
        }
      }
    }
  }
`

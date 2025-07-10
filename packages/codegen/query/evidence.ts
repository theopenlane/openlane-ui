import { gql } from 'graphql-request'
import { EvidenceWhereInput } from '../src/schema'

export const CREATE_EVIDENCE = gql`
  mutation CreateEvidence($input: CreateEvidenceInput!, $evidenceFiles: [Upload!]) {
    createEvidence(input: $input, evidenceFiles: $evidenceFiles) {
      evidence {
        id
      }
    }
  }
`

export const GET_EVIDENCE_FILES = gql`
  query GetEvidenceFiles {
    files {
      edges {
        node {
          id
          providedFileName
          presignedURL
          providedFileExtension
          categoryType
          createdAt
        }
      }
    }
  }
`

export const GET_ALL_EVIDENCES = gql`
  query GetAllEvidences($where: EvidenceWhereInput, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    evidences(where: $where, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          name
          displayID
          description
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`

const EVIDENCE_FIELDS = gql`
  fragment EvidenceFields on Evidence {
    collectionProcedure
    createdAt
    createdBy
    creationDate
    description
    displayID
    id
    name
    ownerID
    renewalDate
    source
    status
    tags
    url
    updatedBy
    updatedAt
  }
`

export const GET_EVIDENCE = gql`
  query GetEvidence($evidenceId: ID!) {
    evidence(id: $evidenceId) {
      ...EvidenceFields
    }
  }
  ${EVIDENCE_FIELDS}
`

export const GET_RENEW_EVIDENCE = gql`
  query GetRenewEvidence($evidenceId: ID!) {
    evidence(id: $evidenceId) {
      collectionProcedure
      createdAt
      createdBy
      creationDate
      description
      displayID
      id
      name
      ownerID
      renewalDate
      source
      status
      tags
      url
      updatedBy
      updatedAt
      programs {
        edges {
          node {
            id
          }
        }
      }
      subcontrols {
        edges {
          node {
            id
          }
        }
      }
      tasks {
        edges {
          node {
            id
          }
        }
      }
      controlObjectives {
        edges {
          node {
            id
          }
        }
      }
      controls {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`

export const GET_EVIDENCE_FILES_PAGINATED = gql`
  query GetEvidenceFilesPaginated($evidenceId: ID!, $after: Cursor, $first: Int, $before: Cursor, $last: Int, $orderBy: [FileOrder!]) {
    evidence(id: $evidenceId) {
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
            providedFileName
            providedFileSize
            providedFileExtension
            id
            uri
            presignedURL
          }
        }
      }
    }
  }
`

export const UPDATE_EVIDENCE = gql`
  mutation UpdateEvidence($updateEvidenceId: ID!, $input: UpdateEvidenceInput!, $evidenceFiles: [Upload!]) {
    updateEvidence(id: $updateEvidenceId, input: $input, evidenceFiles: $evidenceFiles) {
      evidence {
        id
      }
    }
  }
`
export const DELETE_EVIDENCE = gql`
  mutation DeleteEvidence($deleteEvidenceId: ID!) {
    deleteEvidence(id: $deleteEvidenceId) {
      deletedID
    }
  }
`

export const GET_EVIDENCE_LIST = gql`
  query GetEvidenceList($last: Int, $before: Cursor, $first: Int, $after: Cursor, $orderBy: [EvidenceOrder!], $where: EvidenceWhereInput) {
    evidences(last: $last, before: $before, first: $first, after: $after, orderBy: $orderBy, where: $where) {
      totalCount
      pageInfo {
        endCursor
        startCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          isAutomated
          name
          status
          controls {
            edges {
              node {
                refCode
                referenceFramework
              }
            }
          }
          subcontrols {
            edges {
              node {
                refCode
                referenceFramework
              }
            }
          }
        }
      }
    }
  }
`

export const GET_EVIDENCE_COUNTS_BY_STATUS = gql`
  query GetEvidenceCountsByStatus($programId: ID!) {
    approved: evidences(where: { status: APPROVED, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    rejected: evidences(where: { status: REJECTED, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    ready: evidences(where: { status: READY, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    missingArtifact: evidences(where: { status: MISSING_ARTIFACT, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    needsRenewal: evidences(where: { status: NEEDS_RENEWAL, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
  }
`

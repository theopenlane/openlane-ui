import { gql } from 'graphql-request'
import { EvidenceEvidenceStatus, EvidenceWhereInput } from '../src/schema'

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
  query GetEvidenceFiles($where: FileWhereInput, $first: Int, $last: Int, $before: Cursor, $after: Cursor) {
    files(where: $where, first: $first, last: $last, before: $before, after: $after) {
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
      totalCount
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
          name
          displayID
        }
      }
    }
    subcontrols {
      edges {
        node {
          id
          referenceFramework
          refCode
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
          referenceFramework
          refCode
        }
      }
    }
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
          description
          updatedBy
          updatedBy
          updatedAt
          createdAt
          createdBy
          tags
          source
          url
          creationDate
          renewalDate
          collectionProcedure
          controls {
            edges {
              node {
                __typename
                id
                refCode
                referenceFramework
              }
            }
          }
          subcontrols {
            edges {
              node {
                __typename
                id
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

export const GET_EVIDENCE_COUNTS_BY_STATUS_BY_PROGRAM_ID = gql`
  query GetEvidenceCountsByStatusByProgramId($programId: ID!) {
    approved: evidences(where: { status: AUDITOR_APPROVED, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    rejected: evidences(where: { status: REJECTED, hasProgramsWith: [{ id: $programId }] }) {
      totalCount
    }
    ready: evidences(where: { status: READY_FOR_AUDITOR, hasProgramsWith: [{ id: $programId }] }) {
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

export const GET_EVIDENCE_COUNTS_BY_STATUS_ALL_PROGRAMS = gql`
  query GetEvidenceCountsByStatusAllPrograms {
    approved: evidences(where: { status: AUDITOR_APPROVED }) {
      totalCount
    }
    rejected: evidences(where: { status: REJECTED }) {
      totalCount
    }
    ready: evidences(where: { status: READY_FOR_AUDITOR }) {
      totalCount
    }
    missingArtifact: evidences(where: { status: MISSING_ARTIFACT }) {
      totalCount
    }
    needsRenewal: evidences(where: { status: NEEDS_RENEWAL }) {
      totalCount
    }
  }
`

export const GET_FIRST_FIVE_EVIDENCES_BY_STATUS = gql`
  query GetEvidencesByStatus($where: EvidenceWhereInput) {
    evidences(first: 5, where: $where) {
      edges {
        node {
          id
          displayID
        }
      }
    }
  }
`

export const GET_EVIDENCE_FILES_BY_ID = gql`
  query GetEvidenceFilesById($evidenceId: ID!) {
    evidence(id: $evidenceId) {
      files {
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

export const GET_EVIDENCE_TREND_DATA = gql`
  query GetEvidenceTrendData($currentWeekStart: Time!, $previousWeekStart: Time!, $previousWeekEnd: Time!, $status: EvidenceEvidenceStatus) {
    currentWeek: evidences(where: { createdAtGTE: $currentWeekStart, status: $status }) {
      totalCount
    }
    previousWeek: evidences(where: { createdAtGTE: $previousWeekStart, createdAtLT: $previousWeekEnd, status: $status }) {
      totalCount
    }
  }
`

export const GET_PROGRAM_EVIDENCE_TREND_DATA = gql`
  query GetProgramEvidenceTrendData($programId: ID!, $currentWeekStart: Time!, $previousWeekStart: Time!, $previousWeekEnd: Time!, $status: EvidenceEvidenceStatus) {
    currentWeek: evidences(where: { createdAtGTE: $currentWeekStart, hasProgramsWith: [{ id: $programId }], status: $status }) {
      totalCount
    }
    previousWeek: evidences(where: { createdAtGTE: $previousWeekStart, createdAtLT: $previousWeekEnd, hasProgramsWith: [{ id: $programId }], status: $status }) {
      totalCount
    }
  }
`

export const GET_EVIDENCE_SUGGESTED_ACTIONS = gql`
  query EvidenceSuggestedActions {
    unlinked: evidences(where: { hasPrograms: false, hasControls: false, hasSubcontrols: false }) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }
    needingReview: evidences(where: { statusIn: [SUBMITTED, IN_REVIEW] }) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }

    needsRenewal: evidences(where: { status: NEEDS_RENEWAL }) {
      edges {
        node {
          id
          name
          status
          updatedAt
        }
      }
      totalCount
    }
  }
`

export const GET_EVIDENCE_ITEMS_MISSING_ARTIFACT_COUNT = gql`
  query GetItemsMissingEvidenceCount {
    evidences(where: { status: MISSING_ARTIFACT }) {
      totalCount
    }
  }
`

export const GET_EVIDENCE_COMMENTS = gql`
  query GetEvidenceComments($evidenceId: ID!) {
    evidence(id: $evidenceId) {
      comments {
        edges {
          node {
            id
            createdAt
            createdBy
            text
          }
        }
      }
    }
  }
`

export const UPDATE_EVIDENCE_COMMENT = gql`
  mutation UpdateEvidenceComment($input: UpdateNoteInput!, $updateEvidenceCommentId: ID!) {
    updateEvidenceComment(input: $input, id: $updateEvidenceCommentId) {
      evidence {
        id
      }
    }
  }
`

export const CREATE_CSV_BULK_EVIDENCE = gql`
  mutation CreateBulkCSVEvidence($input: Upload!) {
    createBulkCSVEvidence(input: $input) {
      evidences {
        id
      }
    }
  }
`

export const BULK_DELETE_EVIDENCE = gql`
  mutation DeleteBulkEvidence($ids: [ID!]!) {
    deleteBulkEvidence(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_EVIDENCE = gql`
  mutation UpdateBulkEvidence($ids: [ID!]!, $input: UpdateEvidenceInput!) {
    updateBulkEvidence(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

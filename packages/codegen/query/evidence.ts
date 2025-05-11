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
  query GetAllEvidences($where: EvidenceWhereInput) {
    evidences(where: $where) {
      edges {
        node {
          id
          name
          displayID
          description
        }
      }
    }
  }
`

export const GET_EVIDENCE = gql`
  query GetEvidence($evidenceId: ID!) {
    evidence(id: $evidenceId) {
      id
      name
      createdAt
      createdBy
      updatedBy
      updatedAt
      tags
      renewalDate
      creationDate
      status
      source
      description
      displayID
      url
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

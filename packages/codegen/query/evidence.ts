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

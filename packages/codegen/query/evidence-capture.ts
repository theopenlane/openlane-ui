import { gql } from 'graphql-request'

export const GET_EVIDENCE_CAPTURE_COLLECTOR = gql`
  query GetEvidenceCaptureCollector {
    self {
      id
      displayName
      email
      avatarRemoteURL
    }
  }
`

export const CREATE_CAPTURED_EVIDENCE = gql`
  mutation CreateCapturedEvidence($input: CreateEvidenceInput!, $evidenceFiles: [Upload!], $evidenceFilesMetadata: [FileMetadataInput!]) {
    createEvidence(input: $input, evidenceFiles: $evidenceFiles, evidenceFilesMetadata: $evidenceFilesMetadata) {
      evidence {
        id
        displayID
        name
      }
    }
  }
`

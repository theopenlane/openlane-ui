import { gql } from 'graphql-request'

export const GET_ALL_TRUST_CENTER_DOCS = gql`
  query GetTrustCenterDocs($where: TrustCenterDocWhereInput, $first: Int, $orderBy: [TrustCenterDocOrder!], $after: Cursor, $before: Cursor, $last: Int) {
    trustCenters {
      edges {
        node {
          id
          trustCenterDocs(where: $where, first: $first, orderBy: $orderBy, after: $after, before: $before, last: $last) {
            edges {
              node {
                id
                title
                trustCenterDocKindName
                visibility
                tags
                createdAt
                updatedAt
                watermarkingEnabled
                watermarkStatus
                file {
                  presignedURL
                }
                originalFile {
                  presignedURL
                }
                standard {
                  shortName
                  id
                }
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
      }
    }
  }
`
export const UPDATE_TRUST_CENTER_DOC = gql`
  mutation UpdateTrustCenterDoc($updateTrustCenterDocId: ID!, $input: UpdateTrustCenterDocInput!, $trustCenterDocFile: Upload) {
    updateTrustCenterDoc(id: $updateTrustCenterDocId, input: $input, trustCenterDocFile: $trustCenterDocFile) {
      trustCenterDoc {
        id
      }
    }
  }
`
export const CREATE_TRUST_CENTER_DOC = gql`
  mutation CreateTrustCenterDoc($input: CreateTrustCenterDocInput!, $trustCenterDocFile: Upload!) {
    createTrustCenterDoc(input: $input, trustCenterDocFile: $trustCenterDocFile) {
      trustCenterDoc {
        id
      }
    }
  }
`

export const GET_ALL_TRUST_CENTER_DOC_BY_ID = gql`
  query GetTruestCenterDocByID($trustCenterDocId: ID!) {
    trustCenterDoc(id: $trustCenterDocId) {
      id
      title
      trustCenterDocKindName
      visibility
      tags
      file {
        presignedURL
        providedFileName
        providedFileSize
      }
      originalFile {
        presignedURL
        providedFileSize
        providedFileName
      }
      watermarkingEnabled
      watermarkStatus
      standardID
    }
  }
`

export const DELETE_TRUST_CENTER_DOC = gql`
  mutation DeleteTrustCenterDoc($deleteTrustCenterDocId: ID!) {
    deleteTrustCenterDoc(id: $deleteTrustCenterDocId) {
      deletedID
    }
  }
`

export const BULK_DELETE_TRUST_CENTER_DOC = gql`
  mutation BulkDeleteTrustCenterDoc($ids: [ID!]!) {
    deleteBulkTrustCenterDoc(ids: $ids) {
      deletedIDs
    }
  }
`
export const BULK_UPDATE_TRUST_CENTER_DOC = gql`
  mutation BulkUpdateTrustCenterDoc($ids: [ID!]!, $input: UpdateTrustCenterDocInput!) {
    updateBulkTrustCenterDoc(ids: $ids, input: $input) {
      trustCenterDocs {
        id
      }
    }
  }
`

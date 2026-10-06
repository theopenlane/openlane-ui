import { gql } from 'graphql-request'

export const CREATE_EXPORT = gql`
  mutation CreateExport($input: CreateExportInput!) {
    createExport(input: $input) {
      export {
        id
        status
      }
    }
  }
`
export const GET_EXPORT = gql`
  query GetExport($exportId: ID!) {
    export(id: $exportId) {
      id
      status
      errorMessage
      files {
        edges {
          node {
            id
            providedFileName
            providedFileSize
            detectedMimeType
          }
        }
      }
    }
  }
`

export const GET_EXPORT_FILE_CONTENT = gql`
  query GetExportFileContent($fileId: ID!) {
    file(id: $fileId) {
      id
      base64
    }
  }
`

export const GET_EXPORTS = gql`
  query GetExports($where: ExportWhereInput) {
    exports(where: $where) {
      edges {
        node {
          id
          status
          exportType
          errorMessage
          files {
            edges {
              node {
                presignedURL
              }
            }
          }
        }
      }
    }
  }
`

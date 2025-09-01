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
      status
      files {
        edges {
          node {
            presignedURL
          }
        }
      }
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

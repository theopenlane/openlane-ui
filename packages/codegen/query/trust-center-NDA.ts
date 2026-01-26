import { gql } from 'graphql-request'

export const GET_TRUST_CENTER_NDA_FILES = gql`
  query GetTrustCenterNDAFiles($where: TemplateWhereInput) {
    templates(where: $where) {
      edges {
        node {
          id
          updatedAt
          files {
            edges {
              node {
                providedFileName
                id
                presignedURL
                base64
                updatedAt
              }
            }
          }
        }
      }
    }
  }
`

export const CREATE_TRUST_CENTER_NDA = gql`
  mutation CreateTrustCenterNDA($input: CreateTrustCenterNDAInput!, $templateFiles: [Upload!]) {
    createTrustCenterNDA(input: $input, templateFiles: $templateFiles) {
      template {
        id
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_NDA = gql`
  mutation UpdateTrustCenterNDA($updateTrustCenterNdaId: ID!, $templateFiles: [Upload!]) {
    updateTrustCenterNDA(id: $updateTrustCenterNdaId, templateFiles: $templateFiles) {
      template {
        id
      }
    }
  }
`

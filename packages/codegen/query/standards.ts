import { gql } from 'graphql-request'

export const GET_ALL_STANDARDS = gql`
  query GetAllStandards($where: StandardWhereInput) {
    standards(where: $where) {
      edges {
        node {
          id
          shortName
          version
          governingBodyLogoURL
          standardType
          updatedAt
          tags
          description
          domains
          controls(where: { ownerIDIsNil: true }) {
            totalCount
          }
        }
      }
    }
  }
`
export const GET_STANDARD_DETAILS = gql`
  query GetStandardDetails($standardId: ID!) {
    standard(id: $standardId) {
      id
      shortName
      version
      governingBodyLogoURL
      standardType
      updatedAt
      tags
      description
      name
      revision
      link
      framework
      governingBody
      controls(where: { ownerIDIsNil: true }) {
        totalCount
      }
    }
  }
`

export const CREATE_CONTROLS_BY_CLONE = gql`
  mutation CreateControlsByClone($input: CloneControlInput!) {
    createControlsByClone(input: $input) {
      controls {
        id
      }
    }
  }
`

export const GET_ALL_STANDARDS_SELECT = gql`
  query GetAllStandards($where: StandardWhereInput) {
    standards(where: $where) {
      edges {
        node {
          id
          shortName
        }
      }
    }
  }
`

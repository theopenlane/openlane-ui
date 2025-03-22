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
          controls {
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
      description
      name
      revision
      link
      framework
      governingBody
      controls {
        totalCount
      }
    }
  }
`

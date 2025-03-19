import { gql } from 'graphql-request'

export const GET_ALL_STANDARDS = gql`
  query GetAllStandards($where: StandardWhereInput) {
    standards(where: $where) {
      edges {
        node {
          createdAt
          createdBy
          deletedAt
          deletedBy
          description
          domains
          framework
          freeToUse
          governingBody
          governingBodyLogoURL
          id
          isPublic
          link
          name
          owner {
            id
          }
          revision
          shortName
          standardType
          status
          systemOwned
          tags
          updatedAt
          updatedBy
          version
        }
      }
    }
  }
`

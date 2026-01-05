import { gql } from 'graphql-request'

export const GET_TAGS = gql`
  query GetTags {
    tagDefinitions {
      edges {
        node {
          id
          name
          color
        }
      }
    }
  }
`

export const GET_ALL_TAG_DEFINITIONS_PAGINATED = gql`
  query GetAllTagDefinitionsPaginated($where: TagDefinitionWhereInput, $after: Cursor, $first: Int, $before: Cursor, $last: Int) {
    tagDefinitions(where: $where, after: $after, first: $first, before: $before, last: $last) {
      totalCount
      edges {
        node {
          id
          name
          aliases
          systemOwned
          description
          color
          updatedBy
          updatedAt
          createdAt
          createdBy
        }
        cursor
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const CREATE_TAG_DEFINITION = gql`
  mutation CreateTagDefinition($input: CreateTagDefinitionInput!) {
    createTagDefinition(input: $input) {
      tagDefinition {
        id
      }
    }
  }
`

export const UPDATE_TAG_DEFINITION = gql`
  mutation UpdateTagDefinition($updateTagDefinitionId: ID!, $input: UpdateTagDefinitionInput!) {
    updateTagDefinition(id: $updateTagDefinitionId, input: $input) {
      tagDefinition {
        id
      }
    }
  }
`

export const DELETE_TAG_DEFINITION = gql`
  mutation DeleteTagDefinition($deleteTagDefinitionId: ID!) {
    deleteTagDefinition(id: $deleteTagDefinitionId) {
      deletedID
    }
  }
`

export const GET_TAG_DEFINITION_DETAILS = gql`
  query GetTagDefinitionDetails($tagDefinitionId: ID!) {
    tagDefinition(id: $tagDefinitionId) {
      id
      name
      aliases
      color
      description
    }
  }
`

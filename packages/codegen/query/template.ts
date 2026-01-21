import { gql } from 'graphql-request'

export const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($input: CreateTemplateInput!) {
    createTemplate(input: $input) {
      template {
        id
        name
        templateType
        description
        jsonconfig
        uischema
        owner {
          id
        }
      }
    }
  }
`

export const UPDATE_TEMPLATE = gql`
  mutation UpdateTemplate($updateTemplateId: ID!, $input: UpdateTemplateInput!, $templateFiles: [Upload!]) {
    updateTemplate(id: $updateTemplateId, input: $input, templateFiles: $templateFiles) {
      template {
        id
        name
        templateType
        description
        jsonconfig
        uischema
        owner {
          id
        }
      }
    }
  }
`

export const GET_ALL_TEMPLATES = gql`
  query FilterTemplates($where: TemplateWhereInput, $orderBy: [TemplateOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    templates(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          name
          templateType
          description
          jsonconfig
          uischema
          createdAt
          updatedAt
          updatedBy
          createdBy
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
      totalCount
    }
  }
`

export const GET_TEMPLATE = gql`
  query GetTemplate($getTemplateId: ID!) {
    template(id: $getTemplateId) {
      id
      templateType
      name
      description
      jsonconfig
      uischema
    }
  }
`

export const DELETE_TEMPLATE = gql`
  mutation DeleteTemplate($deleteTemplateId: ID!) {
    deleteTemplate(id: $deleteTemplateId) {
      deletedID
    }
  }
`

export const SEARCH_TEMPLATE = gql`
  query SearchTemplates($query: String!) {
    templateSearch(query: $query) {
      edges {
        node {
          id
          name
          templateType
          description
          jsonconfig
          uischema
          createdAt
          updatedAt
        }
      }
      pageInfo {
        endCursor
        startCursor
      }
      totalCount
    }
  }
`

export const CREATE_CSV_BULK_TEMPLATE = gql`
  mutation CreateBulkCSVTemplate($input: Upload!) {
    createBulkCSVTemplate(input: $input) {
      templates {
        id
      }
    }
  }
`

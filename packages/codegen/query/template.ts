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
  mutation UpdateTemplate($updateTemplateId: ID!, $input: UpdateTemplateInput!) {
    updateTemplate(id: $updateTemplateId, input: $input) {
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
  query GetAllTemplates {
    templates {
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
    }
  }
`

export const FILTER_TEMPLATES = gql`
  query FilterTemplates($where: TemplateWhereInput) {
    templates(where: $where) {
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

import { gql } from 'graphql-request'

export const GET_EMAIL_TEMPLATE_CATALOG = gql`
  query EmailTemplateCatalog {
    emailTemplateCatalog {
      entries {
        key
        description
        configSchema
        uiSchema
        exampleValues
        htmlPreview
        variables {
          name
          description
        }
      }
    }
  }
`

export const PREVIEW_EMAIL_TEMPLATE = gql`
  query PreviewEmailTemplate($key: String!, $defaults: Map!) {
    previewEmailTemplate(key: $key, defaults: $defaults)
  }
`

import { gql } from 'graphql-request'

export const GET_EMAIL_TEMPLATE_CATALOG = gql`
  query EmailTemplateCatalog {
    emailTemplateCatalog {
      entries {
        key
        description
        configSchema
        htmlPreview
      }
    }
  }
`

import { gql } from 'graphql-request'

export const GET_INTEGRATIONS = gql`
  query GetIntegrations($where: IntegrationWhereInput) {
    integrations(where: $where) {
      edges {
        node {
          id
          name
          kind
          integrationType
          definitionID
          definitionSlug
          family
          status
          tags
          description
          metadata
          createdAt
          createdBy
          environmentName
          integrationType
          scopeName
        }
      }
    }
  }
`

export const DELETE_INTEGRATION = gql`
  mutation DeleteIntegration($deleteIntegrationId: ID!) {
    deleteIntegration(id: $deleteIntegrationId) {
      deletedID
    }
  }
`

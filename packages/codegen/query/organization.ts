import { gql } from 'graphql-request'

export const GET_ALL_ORGANIZATIONS = gql`
  query GetAllOrganizations {
    organizations {
      edges {
        node {
          id
          name
          displayName
          avatarRemoteURL
          personalOrg
          avatarFile {
            id
            presignedURL
          }
        }
      }
    }
  }
`

export const GET_ORGANIZATION_NAME_BY_ID = gql`
  query GetOrganizationNameByID($organizationId: ID!) {
    organization(id: $organizationId) {
      name
      displayName
    }
  }
`

export const GET_SINGLE_ORGANIZATION_MEMBERS = gql`
  query GetSingleOrganizationMembers($organizationId: ID!) {
    organization(id: $organizationId) {
      members {
        id
        createdAt
        role
        user {
          id
          firstName
          lastName
          authProvider
          avatarRemoteURL
          email
          role
          createdAt
          avatarFile {
            id
            presignedURL
          }
        }
      }
    }
  }
`

export const GET_ALL_ORGANIZATIONS_WITH_MEMBERS = gql`
  query GetAllOrganizationsWithMembers {
    organizations {
      edges {
        node {
          id
          personalOrg
          displayName
          name
          avatarRemoteURL
          avatarFile {
            id
            presignedURL
          }
          members {
            role
          }
        }
      }
    }
  }
`

export const GET_INVITES = gql`
  query GetInvites {
    invites {
      edges {
        node {
          id
          recipient
          status
          createdAt
          expires
          role
        }
      }
    }
  }
`

export const GET_ORGANIZATION_BILLING = gql`
  query GetOrganizationBilling($organizationId: ID!) {
    organization(id: $organizationId) {
      personalOrg
      orgSubscriptions {
        active
        expiresAt
        subscriptionURL
        stripeSubscriptionStatus
        productTier
        productPrice
        features
      }
    }
  }
`

export const GET_ORGANIZATION_SETTING = gql`
  query GetOrganizationSetting($organizationId: ID!) {
    organization(id: $organizationId) {
      setting {
        createdAt
        updatedAt
        createdBy
        updatedBy
        domains
        billingContact
        billingEmail
        billingPhone
        billingAddress
        taxIdentifier
        tags
        geoLocation
        billingNotificationsEnabled
      }
    }
  }
`

export const GET_BILLING_EMAIL = gql`
  query GetBillingEmail($organizationId: ID!) {
    organization(id: $organizationId) {
      setting {
        billingEmail
      }
    }
  }
`

export const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      organization {
        id
      }
    }
  }
`

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($updateOrganizationId: ID!, $input: UpdateOrganizationInput!, $avatarFile: Upload) {
    updateOrganization(id: $updateOrganizationId, input: $input, avatarFile: $avatarFile) {
      organization {
        id
      }
    }
  }
`

export const CREATE_BULK_INVITE = gql`
  mutation CreateBulkInvite($input: [CreateInviteInput!]) {
    createBulkInvite(input: $input) {
      invites {
        id
      }
    }
  }
`

export const DELETE_ORGANIZATION_INVITE = gql`
  mutation DeleteOrganizationInvite($deleteInviteId: ID!) {
    deleteInvite(id: $deleteInviteId) {
      deletedID
    }
  }
`

export const DELETE_ORGANIZATION = gql`
  mutation DeleteOrganization($deleteOrganizationId: ID!) {
    deleteOrganization(id: $deleteOrganizationId) {
      deletedID
    }
  }
`

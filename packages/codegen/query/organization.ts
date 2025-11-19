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
          stripeCustomerID
          setting {
            identityProviderLoginEnforced
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
  query GetSingleOrganizationMembers($organizationId: ID!, $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    organization(id: $organizationId) {
      members(first: $first, after: $after, last: $last, before: $before) {
        edges {
          node {
            id
            createdAt
            role
            user {
              id
              displayName
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
        pageInfo {
          endCursor
          startCursor
          hasPreviousPage
          hasNextPage
        }
        totalCount
      }
    }
  }
`

export const GET_ALL_ORGANIZATIONS_WITH_MEMBERS = gql`
  query GetAllOrganizationsWithMembers($membersWhere: OrgMembershipWhereInput) {
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
          members(where: $membersWhere) {
            edges {
              node {
                id
                role
                user {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_INVITES = gql`
  query GetInvites($where: InviteWhereInput, $orderBy: [InviteOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    invites(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      edges {
        node {
          id
          recipient
          status
          createdAt
          expires
          role
          sendAttempts
        }
      }
      pageInfo {
        startCursor
        endCursor
      }
      totalCount
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
        stripeSubscriptionStatus
        trialExpiresAt
      }
    }
  }
`

export const GET_ORGANIZATION_BILLING_BANNER = gql`
  query GetOrganizationBillingBanner($organizationId: ID!) {
    organization(id: $organizationId) {
      personalOrg
      orgSubscriptions {
        trialExpiresAt
        expiresAt
        stripeSubscriptionStatus
      }
    }
  }
`

export const GET_ORGANIZATION_SETTING = gql`
  query GetOrganizationSetting($organizationId: ID!) {
    organization(id: $organizationId) {
      setting {
        id
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
        allowedEmailDomains
        identityProvider
        identityProviderClientID
        identityProviderClientSecret
        oidcDiscoveryEndpoint
        identityProviderLoginEnforced
        identityProviderAuthTested
        allowMatchingDomainsAutojoin
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

export const UPDATE_ORG_SETTING = gql`
  mutation UpdateOrganizationSetting($updateOrganizationSettingId: ID!, $input: UpdateOrganizationSettingInput!) {
    updateOrganizationSetting(id: $updateOrganizationSettingId, input: $input) {
      organizationSetting {
        id
      }
    }
  }
`
export const TRANSFER_ORGANIZATION_OWNERSHIP = gql`
  mutation TransferOrganizationOwnership($newOwnerEmail: String!) {
    transferOrganizationOwnership(newOwnerEmail: $newOwnerEmail) {
      invitationSent
    }
  }
`

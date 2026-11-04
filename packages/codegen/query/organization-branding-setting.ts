import { gql } from 'graphql-request'

export const GET_ALL_ORGANIZATION_BRANDING_SETTINGS = gql`
  query OrganizationBrandingSettingsWithFilter($where: OrganizationBrandingSettingWhereInput, $orderBy: [OrganizationBrandingSettingOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    organizationBrandingSettings(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          backgroundColor
          createdAt
          createdBy
          fontFamily
          id
          organizationID
          primaryColor
          removeAssessmentBranding
          secondaryColor
          textColor
          updatedAt
          updatedBy
          updatedByImpersonator
        }
      }
      pageInfo {
        endCursor
        startCursor
        hasPreviousPage
        hasNextPage
      }
    }
  }
`

export const ORGANIZATION_BRANDING_SETTING = gql`
  query OrganizationBrandingSetting($organizationBrandingSettingId: ID!) {
    organizationBrandingSetting(id: $organizationBrandingSettingId) {
      backgroundColor
      createdAt
      createdBy
      fontFamily
      id
      organizationID
      primaryColor
      removeAssessmentBranding
      secondaryColor
      textColor
      updatedAt
      updatedBy
      updatedByImpersonator
    }
  }
`

export const CREATE_ORGANIZATION_BRANDING_SETTING = gql`
  mutation CreateOrganizationBrandingSetting($input: CreateOrganizationBrandingSettingInput!) {
    createOrganizationBrandingSetting(input: $input) {
      organizationBrandingSetting {
        id
      }
    }
  }
`

export const UPDATE_ORGANIZATION_BRANDING_SETTING = gql`
  mutation UpdateOrganizationBrandingSetting($updateOrganizationBrandingSettingId: ID!, $input: UpdateOrganizationBrandingSettingInput!) {
    updateOrganizationBrandingSetting(id: $updateOrganizationBrandingSettingId, input: $input) {
      organizationBrandingSetting {
        id
      }
    }
  }
`

export const DELETE_ORGANIZATION_BRANDING_SETTING = gql`
  mutation DeleteOrganizationBrandingSetting($deleteOrganizationBrandingSettingId: ID!) {
    deleteOrganizationBrandingSetting(id: $deleteOrganizationBrandingSettingId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_ORGANIZATION_BRANDING_SETTING = gql`
  mutation CreateBulkCSVOrganizationBrandingSetting($input: Upload!) {
    createBulkCSVOrganizationBrandingSetting(input: $input) {
      organizationBrandingSettings {
        id
      }
    }
  }
`

export const BULK_DELETE_ORGANIZATION_BRANDING_SETTING = gql`
  mutation DeleteBulkOrganizationBrandingSetting($ids: [ID!]!) {
    deleteBulkOrganizationBrandingSetting(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_ORGANIZATION_BRANDING_SETTING = gql`
  mutation UpdateBulkOrganizationBrandingSetting($ids: [ID!]!, $input: UpdateOrganizationBrandingSettingInput!) {
    updateBulkOrganizationBrandingSetting(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

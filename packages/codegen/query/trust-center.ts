import { gql } from 'graphql-request'

export const GET_ALL_TRUST_CENTERS = gql`
  query GetTrustCenter {
    trustCenters {
      edges {
        node {
          id
          slug
          pirschDomainID
          pirschAccessLink
          customDomain {
            id
            cnameRecord
            dnsVerification {
              dnsVerificationStatus
              dnsTxtRecord
              dnsTxtValue
              dnsVerificationStatusReason
            }
            mappableDomain {
              name
            }
          }
          previewDomain {
            cnameRecord
          }
          setting {
            id
            title
            overview
            primaryColor
            themeMode
            foregroundColor
            secondaryForegroundColor
            font
            backgroundColor
            secondaryBackgroundColor
            accentColor
            companyName
            companyDescription
            companyDomain
            statusPageURL
            logoFile {
              id
              presignedURL
            }
            faviconRemoteURL
            faviconFile {
              id
              presignedURL
            }
            overview
            title
            logoRemoteURL
            securityContact
            ndaApprovalRequired
          }
          previewSetting {
            id
            title
            overview
            primaryColor
            themeMode
            foregroundColor
            secondaryForegroundColor
            font
            backgroundColor
            secondaryBackgroundColor
            accentColor
            companyName
            companyDescription
            companyDomain
            statusPageURL
            logoFile {
              id
              presignedURL
            }
            faviconRemoteURL
            faviconFile {
              id
              presignedURL
            }
            logoRemoteURL
            securityContact
            updatedAt
          }
          watermarkConfig {
            id
            file {
              presignedURL
            }
            text
            fontSize
            color
            opacity
            rotation
            isEnabled
          }
        }
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_SETTING = gql`
  mutation UpdateTrustCenterSetting($updateTrustCenterSettingId: ID!, $input: UpdateTrustCenterSettingInput!, $faviconFile: Upload, $logoFile: Upload) {
    updateTrustCenterSetting(id: $updateTrustCenterSettingId, input: $input, faviconFile: $faviconFile, logoFile: $logoFile) {
      trustCenterSetting {
        id
        logoRemoteURL
        faviconRemoteURL
        faviconFile {
          id
        }
        logoFile {
          id
        }
      }
    }
  }
`
export const CREATE_CUSTOM_DOMAIN = gql`
  mutation CreateCustomDomain($input: CreateTrustCenterDomainInput!) {
    createTrustCenterDomain(input: $input) {
      customDomain {
        id
      }
    }
  }
`
export const DELETE_CUSTOM_DOMAIN = gql`
  mutation DeleteCustomDomain($deleteCustomDomainId: ID!) {
    deleteCustomDomain(id: $deleteCustomDomainId) {
      deletedID
    }
  }
`

export const VALIDATE_CUSTOM_DOMAIN = gql`
  mutation ValidateCustomDomain($validateCustomDomainId: ID!) {
    validateCustomDomain(id: $validateCustomDomainId) {
      customDomain {
        id
        dnsVerification {
          dnsVerificationStatus
          dnsVerificationStatusReason
        }
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_WATERMARK_CONFIG = gql`
  mutation UpdateTrustCenterWatermarkConfig($updateTrustCenterWatermarkConfigId: ID!, $input: UpdateTrustCenterWatermarkConfigInput!, $watermarkFile: Upload) {
    updateTrustCenterWatermarkConfig(id: $updateTrustCenterWatermarkConfigId, input: $input, watermarkFile: $watermarkFile) {
      trustCenterWatermarkConfig {
        id
      }
    }
  }
`

export const GET_ALL_TRUST_CENTER_POSTS = gql`
  query GetTrustCenterPosts($trustCenterId: ID!) {
    trustCenter(id: $trustCenterId) {
      posts {
        edges {
          node {
            id
            text
            title
            updatedAt
          }
        }
        totalCount
      }
    }
  }
`

export const UPDATE_TRUST_CENTER = gql`
  mutation UpdateTrustCenter($updateTrustCenterId: ID!, $input: UpdateTrustCenterInput!) {
    updateTrustCenter(id: $updateTrustCenterId, input: $input) {
      trustCenter {
        id
      }
    }
  }
`
export const UPDATE_TRUST_CENTER_POST = gql`
  mutation UpdateTrustCenterPost($updateTrustCenterPostId: ID!, $input: UpdateNoteInput!) {
    updateTrustCenterPost(id: $updateTrustCenterPostId, input: $input) {
      trustCenter {
        id
      }
    }
  }
`

export const GET_ALL_TRUST_CENTER_LAST_UPDATED = gql`
  query TrustCenterLastUpdated($trustCenterId: ID!) {
    trustCenter(id: $trustCenterId) {
      customDomain {
        cnameRecord
        updatedAt
      }
      setting {
        updatedAt
      }
      trustCenterCompliances {
        edges {
          node {
            updatedAt
          }
        }
      }
      trustCenterSubprocessors {
        edges {
          node {
            updatedAt
          }
        }
      }
      trustCenterEntities {
        edges {
          node {
            updatedAt
          }
        }
      }
      trustCenterDocs {
        edges {
          node {
            updatedAt
          }
        }
      }
      posts {
        edges {
          node {
            updatedAt
          }
        }
      }
    }
  }
`

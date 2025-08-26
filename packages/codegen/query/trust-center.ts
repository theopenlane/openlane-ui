import { gql } from 'graphql-request'

export const GET_TRUST_CENTER = gql`
  query GetTrustCenter {
    trustCenters {
      edges {
        node {
          customDomain {
            dnsVerification {
              dnsVerificationStatus
              dnsTxtRecord
              dnsTxtValue
            }
          }
          setting {
            id
            primaryColor
            themeMode
            foregroundColor
            font
            backgroundColor
            accentColor
            logoFile {
              id
              presignedURL
            }
            faviconFile {
              id
              presignedURL
            }
            overview
            title
            logoRemoteURL
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
      }
    }
  }
`
export const CREATE_CUSTOM_DOMAIN = gql`
  mutation CreateCustomDomain($input: CreateCustomDomainInput!) {
    createCustomDomain(input: $input) {
      customDomain {
        id
      }
    }
  }
`

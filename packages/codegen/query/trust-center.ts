import { gql } from 'graphql-request'

export const GET_TRUST_CENTER = gql`
  query GetTrustCenter {
    trustCenters {
      edges {
        node {
          id
          slug
          subprocessorURL
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

export const GET_TRUST_CENTER_DOCS = gql`
  query GetTrustCenterDocs($where: TrustCenterDocWhereInput, $first: Int, $orderBy: [TrustCenterDocOrder!], $after: Cursor, $before: Cursor, $last: Int) {
    trustCenters {
      edges {
        node {
          id
          trustCenterDocs(where: $where, first: $first, orderBy: $orderBy, after: $after, before: $before, last: $last) {
            edges {
              node {
                id
                title
                trustCenterDocKindName
                visibility
                tags
                createdAt
                updatedAt
                watermarkingEnabled
                watermarkStatus
                file {
                  presignedURL
                }
                originalFile {
                  presignedURL
                }
                standard {
                  shortName
                  id
                }
              }
            }
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
            totalCount
          }
        }
      }
    }
  }
`

export const UPDATE_TRUST_CENTER_DOC = gql`
  mutation UpdateTrustCenterDoc($updateTrustCenterDocId: ID!, $input: UpdateTrustCenterDocInput!, $trustCenterDocFile: Upload) {
    updateTrustCenterDoc(id: $updateTrustCenterDocId, input: $input, trustCenterDocFile: $trustCenterDocFile) {
      trustCenterDoc {
        id
      }
    }
  }
`
export const CREATE_TRUST_CENTER_DOC = gql`
  mutation CreateTrsutCenterDoc($input: CreateTrustCenterDocInput!, $trustCenterDocFile: Upload!) {
    createTrustCenterDoc(input: $input, trustCenterDocFile: $trustCenterDocFile) {
      trustCenterDoc {
        id
      }
    }
  }
`

export const GET_TRUST_CENTER_DOC_BY_ID = gql`
  query GetTruestCenterDocByID($trustCenterDocId: ID!) {
    trustCenterDoc(id: $trustCenterDocId) {
      id
      title
      trustCenterDocKindName
      visibility
      tags
      file {
        presignedURL
        providedFileName
        providedFileSize
      }
      originalFile {
        presignedURL
        providedFileSize
        providedFileName
      }
      watermarkingEnabled
      watermarkStatus
      standardID
    }
  }
`

export const DELETE_TRUST_CENTER_DOC = gql`
  mutation DeleteTrustCenterDoc($deleteTrustCenterDocId: ID!) {
    deleteTrustCenterDoc(id: $deleteTrustCenterDocId) {
      deletedID
    }
  }
`

export const BULK_DELETE_TRUST_CENTER_DOC = gql`
  mutation BulkDeleteTrustCenterDoc($ids: [ID!]!) {
    deleteBulkTrustCenterDoc(ids: $ids) {
      deletedIDs
    }
  }
`
export const BULK_UPDATE_TRUST_CENTER_DOC = gql`
  mutation BulkUpdateTrustCenterDoc($ids: [ID!]!, $input: UpdateTrustCenterDocInput!) {
    updateBulkTrustCenterDoc(ids: $ids, input: $input) {
      trustCenterDocs {
        id
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

export const GET_TRUST_CENTER_POSTS = gql`
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

export const GET_TRUST_CENTER_LAST_UPDATED = gql`
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

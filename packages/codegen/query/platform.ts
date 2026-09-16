import { gql } from 'graphql-request'

export const GET_ALL_PLATFORMS = gql`
  query PlatformsWithFilter($where: PlatformWhereInput, $orderBy: [PlatformOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    platforms(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          displayID
          name
          status
          scopeName
          environmentName
          containsPii
          businessPurpose
          createdAt
          createdBy
          updatedAt
          updatedBy
          internalOwner
          internalOwnerUserID
          internalOwnerGroupID
          internalOwnerIdentityHolderID
          internalOwnerUser {
            id
            displayName
            email
          }
          internalOwnerGroup {
            id
            displayName
          }
          internalOwnerIdentityHolder {
            id
            fullName
            email
          }
          businessOwner
          businessOwnerUser {
            id
            displayName
            email
          }
          businessOwnerIdentityHolder {
            id
            fullName
            email
          }
          businessOwnerGroup {
            id
            name
          }
          technicalOwner
          technicalOwnerUser {
            id
            displayName
            email
          }
          technicalOwnerIdentityHolder {
            id
            fullName
            email
          }
          technicalOwnerGroup {
            id
            name
          }
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

export const GET_PLATFORM_BY_ID_MINIFIED = gql`
  query GetPlatformByIdMinified($platformId: ID!) {
    platform(id: $platformId) {
      id
      name
      displayID
    }
  }
`

export const PLATFORM_DIAGRAM_FILE_FIELDS_FRAGMENT = gql`
  fragment PlatformDiagramFileFields on File {
    id
    providedFileName
    presignedURL
    createdAt
  }
`

export const PLATFORM_LINKED_ASSET_FIELDS_FRAGMENT = gql`
  fragment PlatformLinkedAssetFields on Asset {
    id
    name
    assetType
    internalOwner
    internalOwnerUser {
      id
      displayName
      email
    }
    internalOwnerGroup {
      id
      displayName
    }
  }
`

export const PLATFORM_LINKED_VENDOR_FIELDS_FRAGMENT = gql`
  fragment PlatformLinkedVendorFields on Entity {
    id
    name
    displayName
    status
    logoFile {
      base64
    }
    internalOwner
    internalOwnerUser {
      id
      displayName
      email
    }
    internalOwnerGroup {
      id
      displayName
    }
  }
`

export const PLATFORM = gql`
  query Platform($platformId: ID!) {
    platform(id: $platformId) {
      id
      name
      description
      status
      scopeName
      environmentName
      containsPii
      businessPurpose
      dataFlowSummary
      trustBoundaryDescription
      businessOwner
      businessOwnerUser {
        id
        displayName
        email
      }
      businessOwnerIdentityHolder {
        id
        fullName
        email
      }
      businessOwnerGroup {
        id
        name
      }
      technicalOwner
      technicalOwnerUser {
        id
        displayName
        email
      }
      technicalOwnerIdentityHolder {
        id
        fullName
        email
      }
      technicalOwnerGroup {
        id
        name
      }
      internalOwner
      internalOwnerUser {
        id
        displayName
        email
      }
      internalOwnerIdentityHolder {
        id
        fullName
        email
      }
      internalOwnerGroup {
        id
        name
      }
      securityOwner
      securityOwnerUser {
        id
        displayName
        email
      }
      securityOwnerIdentityHolder {
        id
        fullName
        email
      }
      securityOwnerGroup {
        id
        name
      }
    }
  }
`

export const PLATFORM_ASSETS = gql`
  ${PLATFORM_LINKED_ASSET_FIELDS_FRAGMENT}
  query PlatformAssets($platformId: ID!) {
    platform(id: $platformId) {
      id
      assets {
        edges {
          node {
            ...PlatformLinkedAssetFields
          }
        }
      }
      outOfScopeAssets {
        edges {
          node {
            ...PlatformLinkedAssetFields
          }
        }
      }
    }
  }
`

export const PLATFORM_VENDORS = gql`
  ${PLATFORM_LINKED_VENDOR_FIELDS_FRAGMENT}
  query PlatformVendors($platformId: ID!) {
    platform(id: $platformId) {
      id
      entities {
        edges {
          node {
            ...PlatformLinkedVendorFields
          }
        }
      }
      outOfScopeVendors {
        edges {
          node {
            ...PlatformLinkedVendorFields
          }
        }
      }
    }
  }
`

export const PLATFORM_DIAGRAMS = gql`
  ${PLATFORM_DIAGRAM_FILE_FIELDS_FRAGMENT}
  query PlatformDiagrams($platformId: ID!) {
    platform(id: $platformId) {
      id
      architectureDiagrams {
        edges {
          node {
            ...PlatformDiagramFileFields
          }
        }
      }
      dataFlowDiagrams {
        edges {
          node {
            ...PlatformDiagramFileFields
          }
        }
      }
      trustBoundaryDiagrams {
        edges {
          node {
            ...PlatformDiagramFileFields
          }
        }
      }
    }
  }
`

export const CREATE_PLATFORM = gql`
  mutation CreatePlatform($input: CreatePlatformInput!) {
    createPlatform(input: $input) {
      platform {
        id
      }
    }
  }
`

export const UPDATE_PLATFORM = gql`
  mutation UpdatePlatform($updatePlatformId: ID!, $input: UpdatePlatformInput!, $architectureDiagrams: [Upload!], $dataFlowDiagrams: [Upload!], $trustBoundaryDiagrams: [Upload!]) {
    updatePlatform(id: $updatePlatformId, input: $input, architectureDiagrams: $architectureDiagrams, dataFlowDiagrams: $dataFlowDiagrams, trustBoundaryDiagrams: $trustBoundaryDiagrams) {
      platform {
        id
      }
    }
  }
`

export const DELETE_PLATFORM = gql`
  mutation DeletePlatform($deletePlatformId: ID!) {
    deletePlatform(id: $deletePlatformId) {
      deletedID
    }
  }
`

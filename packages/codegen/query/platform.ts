import { gql } from 'graphql-request'

export const GET_ALL_PLATFORMS = gql`
  query PlatformsWithFilter($where: PlatformWhereInput, $orderBy: [PlatformOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    platforms(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          accessModelID
          accessModelName
          businessOwner
          businessOwnerGroupID
          businessOwnerUserID
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
          businessPurpose
          containsPii
          costCenter
          createdAt
          createdBy
          criticalityID
          criticalityName
          dataFlowSummary
          description
          displayID
          encryptionStatusID
          encryptionStatusName
          environmentID
          environmentName
          estimatedMonthlyCost
          externalReferenceID
          hasPendingWorkflow
          hasWorkflowHistory
          id
          internalOwner
          internalOwnerGroupID
          internalOwnerUserID
          metadata
          name
          physicalLocation
          platformDataClassificationID
          platformDataClassificationName
          platformKindID
          platformKindName
          platformOwnerID
          purchaseDate
          region
          scopeID
          scopeName
          scopeStatement
          securityOwner
          securityOwnerGroupID
          securityOwnerUserID
          securityTierID
          securityTierName
          sourceIdentifier
          status
          technicalOwner
          technicalOwnerGroupID
          technicalOwnerUserID
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
          trustBoundaryDescription
          updatedAt
          updatedBy
          workflowEligibleMarker
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

export const PLATFORM = gql`
  ${PLATFORM_DIAGRAM_FILE_FIELDS_FRAGMENT}
  query Platform($platformId: ID!) {
    platform(id: $platformId) {
      accessModelID
      accessModelName
      businessOwner
      businessOwnerGroupID
      businessOwnerUserID
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
      businessPurpose
      containsPii
      costCenter
      createdAt
      createdBy
      criticalityID
      criticalityName
      dataFlowSummary
      description
      displayID
      encryptionStatusID
      encryptionStatusName
      environmentID
      environmentName
      estimatedMonthlyCost
      externalReferenceID
      hasPendingWorkflow
      hasWorkflowHistory
      id
      internalOwner
      internalOwnerGroupID
      internalOwnerUserID
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
      metadata
      name
      physicalLocation
      platformDataClassificationID
      platformDataClassificationName
      platformKindID
      platformKindName
      platformOwnerID
      platformOwner {
        id
        displayName
        email
      }
      purchaseDate
      region
      scopeID
      scopeName
      scopeStatement
      securityOwner
      securityOwnerGroupID
      securityOwnerUserID
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
      securityTierID
      securityTierName
      sourceIdentifier
      status
      technicalOwner
      technicalOwnerGroupID
      technicalOwnerUserID
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
      trustBoundaryDescription
      updatedAt
      updatedBy
      workflowEligibleMarker
      assets {
        edges {
          node {
            id
            name
            assetType
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
              displayName
            }
          }
        }
      }
      outOfScopeAssets {
        edges {
          node {
            id
            name
            assetType
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
              displayName
            }
          }
        }
      }
      entities {
        edges {
          node {
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
            internalOwnerIdentityHolder {
              id
              fullName
              email
            }
            internalOwnerGroup {
              id
              displayName
            }
          }
        }
      }
      outOfScopeVendors {
        edges {
          node {
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
            internalOwnerIdentityHolder {
              id
              fullName
              email
            }
            internalOwnerGroup {
              id
              displayName
            }
          }
        }
      }
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

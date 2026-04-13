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

export const PLATFORM = gql`
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
          }
        }
      }
      outOfScopeAssets {
        edges {
          node {
            id
            name
            assetType
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
          }
        }
      }
      architectureDiagrams {
        edges {
          node {
            id
            providedFileName
            presignedURL
          }
        }
      }
      dataFlowDiagrams {
        edges {
          node {
            id
            providedFileName
            presignedURL
          }
        }
      }
      trustBoundaryDiagrams {
        edges {
          node {
            id
            providedFileName
            base64
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

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
          technicalOwner
          technicalOwnerGroupID
          technicalOwnerUserID
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
      technicalOwner
      technicalOwnerGroupID
      technicalOwnerUserID
      trustBoundaryDescription
      updatedAt
      updatedBy
      workflowEligibleMarker
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
  mutation UpdatePlatform($updatePlatformId: ID!, $input: UpdatePlatformInput!) {
    updatePlatform(id: $updatePlatformId, input: $input) {
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

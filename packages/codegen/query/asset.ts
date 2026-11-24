import { gql } from 'graphql-request'

export const GET_ALL_ASSETS = gql`
  query AssetsWithFilter($where: AssetWhereInput, $orderBy: [AssetOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    assets(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          internalOwner
          internalOwnerIdentityHolder {
            id
            fullName
            email
          }
          internalOwnerGroup {
            id
            displayName
          }
          internalOwnerUser {
            id
            displayName
          }
          accessModelName
          assetDataClassificationName
          assetSubtypeName
          assetType
          containsPii
          costCenter
          cpe
          createdAt
          createdBy
          updatedAt
          updatedBy
          criticalityName
          description
          displayName
          encryptionStatusName
          environmentName
          estimatedMonthlyCost
          identifier
          physicalLocation
          purchaseDate
          region
          scopeName
          securityTierName
          sourceIdentifier
          sourceType
          tags
          website
          categories
          entities {
            edges {
              node {
                id
                name
                displayName
              }
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
    }
  }
`

export const ASSET = gql`
  query Asset($assetId: ID!) {
    asset(id: $assetId) {
      id
      name
      internalOwner
      internalOwnerIdentityHolder {
        id
        fullName
        email
      }
      internalOwnerGroup {
        id
        displayName
      }
      internalOwnerUser {
        id
        displayName
      }
      accessModelName
      assetDataClassificationName
      assetSubtypeName
      assetType
      containsPii
      costCenter
      cpe
      createdAt
      createdBy
      updatedAt
      updatedBy
      criticalityName
      description
      displayName
      encryptionStatusName
      environmentName
      estimatedMonthlyCost
      identifier
      physicalLocation
      purchaseDate
      region
      scopeName
      securityTierName
      sourceDefinitionID
      sourceIdentifier
      sourceType
      observedAt
      tags
      website
      categories
      entities {
        edges {
          node {
            id
            name
            displayName
          }
        }
      }
    }
  }
`

export const CREATE_ASSET = gql`
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      asset {
        id
      }
    }
  }
`

export const UPDATE_ASSET = gql`
  mutation UpdateAsset($updateAssetId: ID!, $input: UpdateAssetInput!) {
    updateAsset(id: $updateAssetId, input: $input) {
      asset {
        id
      }
    }
  }
`

export const DELETE_ASSET = gql`
  mutation DeleteAsset($deleteAssetId: ID!) {
    deleteAsset(id: $deleteAssetId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_ASSET = gql`
  mutation CreateBulkCSVAsset($input: Upload!) {
    createBulkCSVAsset(input: $input) {
      assets {
        id
      }
    }
  }
`

export const CREATE_BULK_ASSET = gql`
  mutation CreateBulkAsset($input: [CreateAssetInput!]) {
    createBulkAsset(input: $input) {
      assets {
        id
      }
    }
  }
`

export const BULK_DELETE_ASSET = gql`
  mutation DeleteBulkAsset($ids: [ID!]!) {
    deleteBulkAsset(ids: $ids) {
      deletedIDs
      notDeletedIDs
      error
    }
  }
`

export const GET_ASSET_ASSOCIATIONS = gql`
  query GetAssetAssociations(
    $assetId: ID!
    $withScans: Boolean!
    $withEntities: Boolean!
    $withIdentityHolders: Boolean!
    $withControls: Boolean!
    $withInternalPolicies: Boolean!
    $withSubcontrols: Boolean!
    $withFindings: Boolean!
    $withVulnerabilities: Boolean!
    $withReviews: Boolean!
    $withRemediations: Boolean!
  ) {
    asset(id: $assetId) {
      scans @include(if: $withScans) {
        edges {
          node {
            id
            target
          }
        }
        totalCount
      }
      entities @include(if: $withEntities) {
        edges {
          node {
            id
            name
            displayName
          }
        }
        totalCount
      }
      identityHolders @include(if: $withIdentityHolders) {
        edges {
          node {
            id
            fullName
            displayID
            identityHolderType
            title
          }
        }
        totalCount
      }
      controls @include(if: $withControls) {
        edges {
          node {
            id
            refCode
            description
            displayID
            referenceFramework
          }
        }
        totalCount
      }
      internalPolicies @include(if: $withInternalPolicies) {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      subcontrols @include(if: $withSubcontrols) {
        edges {
          node {
            id
            refCode
            displayID
          }
        }
        totalCount
      }
      findings @include(if: $withFindings) {
        edges {
          node {
            id
            displayName
            displayID
          }
        }
        totalCount
      }
      vulnerabilities @include(if: $withVulnerabilities) {
        edges {
          node {
            id
            cveID
            externalID
            displayName
            displayID
          }
        }
        totalCount
      }
      reviews @include(if: $withReviews) {
        edges {
          node {
            id
            title
          }
        }
        totalCount
      }
      remediations @include(if: $withRemediations) {
        edges {
          node {
            id
            title
            displayID
          }
        }
        totalCount
      }
    }
  }
`

export const BULK_EDIT_ASSET = gql`
  mutation UpdateBulkAsset($ids: [ID!]!, $input: UpdateAssetInput!) {
    updateBulkAsset(ids: $ids, input: $input) {
      updatedIDs
      notUpdatedIDs
      error
    }
  }
`

export const GET_ASSET_RELATIONSHIPS = gql`
  query GetAssetRelationships($assetId: ID!, $first: Int, $withSystems: Boolean!, $withPlatforms: Boolean!) {
    asset(id: $assetId) {
      id
      connectedAssets(first: $first) {
        totalCount
        edges {
          node {
            id
            name
            displayName
            assetType
            assetSubtypeName
          }
        }
      }
      connectedFrom(first: $first) {
        totalCount
        edges {
          node {
            id
            name
            displayName
            assetType
            assetSubtypeName
          }
        }
      }
      sourcePlatform @include(if: $withPlatforms) {
        id
        name
      }
      platforms(first: $first) @include(if: $withPlatforms) {
        totalCount
        edges {
          node {
            id
            name
            status
          }
        }
      }
      systemDetails(first: $first) @include(if: $withSystems) {
        totalCount
        edges {
          node {
            id
            systemName
            version
            sensitivityLevel
            lastReviewed
            authorizationBoundary
          }
        }
      }
    }
  }
`

export const GET_ASSET_TOPOLOGY_PLATFORMS = gql`
  query GetAssetTopologyPlatforms($assetId: ID!, $where: PlatformWhereInput, $first: Int, $systemsFirst: Int, $assetsFirst: Int, $withSystems: Boolean!) {
    platforms(where: $where, first: $first) {
      totalCount
      edges {
        node {
          id
          name
          status
          linkedAsset: assets(where: { id: $assetId }, first: 1) {
            totalCount
          }
          assetSystems: systemDetails(where: { hasAssetsWith: [{ id: $assetId }] }, first: $systemsFirst) @include(if: $withSystems) {
            edges {
              node {
                id
              }
            }
          }
          systemDetails(first: $systemsFirst) @include(if: $withSystems) {
            totalCount
            edges {
              node {
                id
                systemName
                sensitivityLevel
                assets(first: $assetsFirst) {
                  totalCount
                  edges {
                    node {
                      id
                      name
                      displayName
                      assetType
                      assetSubtypeName
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

export const GET_ASSET_TOPOLOGY_SYSTEMS = gql`
  query GetAssetTopologySystems($where: SystemDetailWhereInput, $first: Int, $assetsFirst: Int) {
    systemDetails(where: $where, first: $first) {
      totalCount
      edges {
        node {
          id
          systemName
          sensitivityLevel
          assets(first: $assetsFirst) {
            totalCount
            edges {
              node {
                id
                name
                displayName
                assetType
                assetSubtypeName
              }
            }
          }
        }
      }
    }
  }
`

export const GET_ASSET_VULNERABILITIES = gql`
  query GetAssetVulnerabilities($where: VulnerabilityWhereInput, $first: Int, $after: Cursor) {
    vulnerabilities(where: $where, first: $first, after: $after) {
      totalCount
      edges {
        node {
          id
          cveID
          displayID
          displayName
          externalID
          summary
          severity
          securityLevel
          open
          vulnerabilityStatusName
          source
          sourceDefinitionID
          environmentName
          remediationSLA
          discoveredAt
          createdAt
          createdBy
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

export const GET_ASSET_FINDINGS = gql`
  query GetAssetFindings($where: FindingWhereInput, $first: Int, $after: Cursor) {
    findings(where: $where, first: $first, after: $after) {
      totalCount
      edges {
        node {
          id
          displayID
          displayName
          externalID
          category
          severity
          securityLevel
          open
          findingStatusName
          source
          sourceDefinitionID
          environmentName
          remediationSLA
          reportedAt
          createdAt
          createdBy
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

export const GET_ASSET_RISKS = gql`
  query GetAssetRisks($where: RiskWhereInput, $first: Int, $after: Cursor) {
    risks(where: $where, first: $first, after: $after) {
      totalCount
      edges {
        node {
          id
          displayID
          name
          impact
          status
          sourceDefinitionID
          environmentName
          dueDate
          createdAt
          createdBy
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

export const GET_ASSET_VENDORS = gql`
  query GetAssetVendors($assetId: ID!, $first: Int) {
    asset(id: $assetId) {
      id
      entities(first: $first) {
        totalCount
        edges {
          node {
            id
            name
            displayName
            domains
            status
            approvedForUse
            providedServices
            ssoEnforced
            mfaEnforced
            tier
            riskRating
            reviewFrequency
            nextReviewAt
            hasSoc2
            soc2PeriodEnd
            logoFile {
              base64
            }
            createdAt
            createdBy
            sourceDefinitionID
          }
        }
      }
    }
  }
`

export const GET_VENDOR_ASSETS = gql`
  query GetVendorAssets($where: AssetWhereInput, $orderBy: [AssetOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor, $withVulnerabilities: Boolean!, $withFindings: Boolean!) {
    assets(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          displayName
          assetType
          assetSubtypeName
          environmentName
          openVulnerabilities: vulnerabilities(where: { open: true }) @include(if: $withVulnerabilities) {
            totalCount
          }
          openFindings: findings(where: { open: true }) @include(if: $withFindings) {
            totalCount
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

export const GET_ASSET_READINESS_REVIEWS = gql`
  query GetAssetReadinessReviews($assetReviewWhere: ReviewWhereInput, $accessReviewWhere: ReviewWhereInput, $orderBy: [ReviewOrder!], $first: Int) {
    assetReviews: reviews(where: $assetReviewWhere, orderBy: $orderBy, first: $first) {
      edges {
        node {
          id
          title
          reviewedAt
          createdAt
        }
      }
    }
    accessReviews: reviews(where: $accessReviewWhere, orderBy: $orderBy, first: $first) {
      edges {
        node {
          id
          title
          reviewedAt
          createdAt
        }
      }
    }
  }
`

export const GET_ASSET_READINESS_SCANS = gql`
  query GetAssetReadinessScans($where: ScanWhereInput, $orderBy: [ScanOrder!], $first: Int) {
    scans(where: $where, orderBy: $orderBy, first: $first) {
      edges {
        node {
          id
          target
          scanType
          scanDate
          createdAt
        }
      }
    }
  }
`

export const GET_ASSET_READINESS_EVIDENCE = gql`
  query GetAssetReadinessEvidence(
    $linkedWhere: ControlWhereInput
    $missingWhere: ControlWhereInput
    $staleWhere: ControlWhereInput
    $linkedSubcontrolWhere: SubcontrolWhereInput
    $missingSubcontrolWhere: SubcontrolWhereInput
    $staleSubcontrolWhere: SubcontrolWhereInput
    $first: Int
  ) {
    linkedControls: controls(where: $linkedWhere) {
      totalCount
    }
    missingControls: controls(where: $missingWhere, first: $first) {
      totalCount
      edges {
        node {
          id
          refCode
        }
      }
    }
    staleControls: controls(where: $staleWhere, first: $first) {
      totalCount
      edges {
        node {
          id
          refCode
        }
      }
    }
    linkedSubcontrols: subcontrols(where: $linkedSubcontrolWhere) {
      totalCount
    }
    missingSubcontrols: subcontrols(where: $missingSubcontrolWhere, first: $first) {
      totalCount
      edges {
        node {
          id
          refCode
        }
      }
    }
    staleSubcontrols: subcontrols(where: $staleSubcontrolWhere, first: $first) {
      totalCount
      edges {
        node {
          id
          refCode
        }
      }
    }
  }
`

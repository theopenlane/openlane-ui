import { gql } from 'graphql-request'

export const ASSETS_WITH_FILTER = gql`
  query AssetsWithFilter($where: AssetWhereInput, $orderBy: [AssetOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    assets(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          id
          name
          internalOwner
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

// export const BULK_EDIT_ASSET = gql`
//   mutation UpdateBulkAsset($ids: [ID!]!, $input: UpdateAssetInput!) {
//     updateBulkAsset(ids: $ids, input: $input) {
//       updatedIDs
//     }
//   }
// `

export const BULK_DELETE_ASSET = gql`
  mutation DeleteBulkAsset($ids: [ID!]!) {
    deleteBulkAsset(ids: $ids) {
      deletedIDs
    }
  }
`

export const GET_ASSET_ASSOCIATIONS = gql`
  query GetAssetAssociations($assetId: ID!) {
    asset(id: $assetId) {
      controls {
        edges {
          node {
            id
            refCode
            description
            displayID
            referenceFramework
          }
        }
      }
    }
  }
`

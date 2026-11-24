import { gql } from 'graphql-request'

export const GET_ASSET_HISTORIES = gql`
  query GetAssetHistories($where: AssetHistoryWhereInput, $orderBy: AssetHistoryOrder, $first: Int, $after: Cursor) {
    assetHistories(where: $where, orderBy: $orderBy, first: $first, after: $after) {
      edges {
        node {
          id
          historyTime
          operation
          createdBy
          updatedBy
          name
          displayName
          description
          identifier
          website
          physicalLocation
          region
          containsPii
          sourceType
          sourceIdentifier
          costCenter
          estimatedMonthlyCost
          purchaseDate
          cpe
          categories
          tags
          assetType
          assetSubtypeName
          assetDataClassificationName
          environmentName
          scopeName
          accessModelName
          encryptionStatusName
          securityTierName
          criticalityName
          internalOwner
          internalOwnerUserID
          internalOwnerGroupID
          internalOwnerIdentityHolderID
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`

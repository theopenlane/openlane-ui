import { gql } from 'graphql-request'

export const GET_ALL_ENTITIES = gql`
  query EntitiesWithFilter($where: EntityWhereInput, $orderBy: [EntityOrder!], $first: Int, $after: Cursor, $last: Int, $before: Cursor) {
    entities(where: $where, orderBy: $orderBy, first: $first, after: $after, last: $last, before: $before) {
      totalCount
      edges {
        node {
          annualSpend
          approvedForUse
          autoRenews
          billingModel
          contractEndDate
          contractRenewalAt
          contractStartDate
          createdAt
          createdBy
          description
          displayName
          domains
          entityRelationshipStateID
          entityRelationshipStateName
          entitySecurityQuestionnaireStatusID
          entitySecurityQuestionnaireStatusName
          entitySourceTypeID
          entitySourceTypeName
          entityTypeID
          environmentID
          environmentName
          hasSoc2
          id
          logoFile {
            base64
          }
          internalOwner
          internalOwnerGroup {
            id
            displayName
          }
          internalOwnerUser {
            id
            displayName
          }
          lastReviewedAt
          mfaEnforced
          mfaSupported
          name
          nextReviewAt
          renewalRisk
          reviewedBy
          reviewedByGroup {
            id
            displayName
          }
          reviewedByUser {
            id
            displayName
          }
          reviewFrequency
          riskRating
          riskScore
          scopeID
          scopeName
          soc2PeriodEnd
          spendCurrency
          ssoEnforced
          status
          statusPageURL
          systemOwned
          terminationNoticeDays
          tags
          tier
          updatedAt
          updatedBy
          vendorMetadata
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

export const ENTITY = gql`
  query Entity($entityId: ID!) {
    entity(id: $entityId) {
      annualSpend
      approvedForUse
      autoRenews
      billingModel
      contractEndDate
      contractRenewalAt
      contractStartDate
      createdAt
      createdBy
      description
      displayName
      domains
      entityRelationshipStateID
      entityRelationshipStateName
      entitySecurityQuestionnaireStatusID
      entitySecurityQuestionnaireStatusName
      entitySourceTypeID
      entitySourceTypeName
      entityTypeID
      environmentID
      environmentName
      hasSoc2
      id
      internalOwner
      internalOwnerGroup {
        id
        displayName
      }
      internalOwnerUser {
        id
        displayName
      }
      lastReviewedAt
      logoFileID
      logoFile {
        base64
      }
      mfaEnforced
      mfaSupported
      name
      nextReviewAt
      renewalRisk
      reviewedBy
      reviewedByGroup {
        id
        displayName
      }
      reviewedByUser {
        id
        displayName
      }
      reviewFrequency
      riskRating
      riskScore
      scopeID
      scopeName
      soc2PeriodEnd
      spendCurrency
      ssoEnforced
      status
      statusPageURL
      systemOwned
      tags
      terminationNoticeDays
      tier
      updatedAt
      updatedBy
      vendorMetadata
    }
  }
`

export const CREATE_ENTITY = gql`
  mutation CreateEntity($input: CreateEntityInput!, $entityTypeName: String) {
    createEntity(input: $input, entityTypeName: $entityTypeName) {
      entity {
        id
      }
    }
  }
`

export const UPDATE_ENTITY = gql`
  mutation UpdateEntity($updateEntityId: ID!, $input: UpdateEntityInput!) {
    updateEntity(id: $updateEntityId, input: $input) {
      entity {
        id
      }
    }
  }
`

export const DELETE_ENTITY = gql`
  mutation DeleteEntity($deleteEntityId: ID!) {
    deleteEntity(id: $deleteEntityId) {
      deletedID
    }
  }
`

export const CREATE_CSV_BULK_ENTITY = gql`
  mutation CreateBulkCSVEntity($input: Upload!, $entityTypeName: String) {
    createBulkCSVEntity(input: $input, entityTypeName: $entityTypeName) {
      entities {
        id
      }
    }
  }
`

export const BULK_DELETE_ENTITY = gql`
  mutation DeleteBulkEntity($ids: [ID!]!) {
    deleteBulkEntity(ids: $ids) {
      deletedIDs
    }
  }
`

export const BULK_EDIT_ENTITY = gql`
  mutation UpdateBulkEntity($ids: [ID!]!, $input: UpdateEntityInput!) {
    updateBulkEntity(ids: $ids, input: $input) {
      updatedIDs
    }
  }
`

export const GET_ENTITY_FILES_PAGINATED = gql`
  query GetEntityFilesPaginated($entityId: ID!, $after: Cursor, $first: Int, $before: Cursor, $last: Int, $orderBy: [FileOrder!], $where: FileWhereInput) {
    entity(id: $entityId) {
      files(after: $after, first: $first, before: $before, last: $last, orderBy: $orderBy, where: $where) {
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
        edges {
          node {
            providedFileName
            providedFileSize
            providedFileExtension
            id
            uri
            presignedURL
            categoryType
            createdAt
          }
        }
      }
    }
  }
`

export const UPDATE_ENTITY_WITH_FILES = gql`
  mutation UpdateEntityWithFiles($updateEntityId: ID!, $input: UpdateEntityInput!, $entityFiles: [Upload!], $logoFile: Upload) {
    updateEntity(id: $updateEntityId, input: $input, entityFiles: $entityFiles, logoFile: $logoFile) {
      entity {
        id
      }
    }
  }
`

export const CREATE_ENTITY_WITH_FILES = gql`
  mutation CreateEntityWithFiles($input: CreateEntityInput!, $entityTypeName: String, $entityFiles: [Upload!], $logoFile: Upload) {
    createEntity(input: $input, entityTypeName: $entityTypeName, entityFiles: $entityFiles, logoFile: $logoFile) {
      entity {
        id
      }
    }
  }
`

export const GET_ENTITY_ASSOCIATIONS = gql`
  query GetEntityAssociations($entityId: ID!) {
    entity(id: $entityId) {
      assets {
        edges {
          node {
            id
            name
            displayName
            environmentName
            scopeName
            assetType
          }
        }
        totalCount
      }
      scans {
        edges {
          node {
            id
            target
          }
        }
        totalCount
      }
      campaigns {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      identityHolders {
        edges {
          node {
            id
            fullName
            displayID
          }
        }
        totalCount
      }
      integrations {
        edges {
          node {
            id
            name
            kind
            description
            environmentName
            integrationType
            updatedAt
          }
        }
        totalCount
      }
      controls {
        edges {
          node {
            id
            refCode
            title
            description
          }
        }
        totalCount
      }
      internalPolicies {
        edges {
          node {
            id
            name
            displayID
          }
        }
        totalCount
      }
      subcontrols {
        edges {
          node {
            id
            refCode
            displayID
          }
        }
        totalCount
      }
    }
  }
`

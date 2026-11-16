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
          lastReviewedAt
          mfaEnforced
          mfaSupported
          name
          nextReviewAt
          renewalRisk
          reviewedBy
          reviewedByIdentityHolder {
            id
            fullName
            email
          }
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

export const GET_ENTITY_OPTIONS = gql`
  query GetEntityOptions($where: EntityWhereInput, $first: Int) {
    entities(where: $where, first: $first) {
      edges {
        node {
          id
          name
          displayName
        }
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
      lastReviewedAt
      linkedAssetIds
      links
      logoFileID
      logoFile {
        base64
      }
      mfaEnforced
      mfaSupported
      name
      nextReviewAt
      providedServices
      renewalRisk
      reviewedBy
      reviewedByIdentityHolder {
        id
        fullName
        email
      }
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

export const CREATE_BULK_ENTITY = gql`
  mutation CreateBulkEntity($input: [CreateEntityInput!], $entityTypeName: String) {
    createBulkEntity(input: $input, entityTypeName: $entityTypeName) {
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
      notDeletedIDs
      error
    }
  }
`

export const BULK_EDIT_ENTITY = gql`
  mutation UpdateBulkEntity($ids: [ID!]!, $input: UpdateEntityInput!) {
    updateBulkEntity(ids: $ids, input: $input) {
      updatedIDs
      notUpdatedIDs
      error
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
            name
            providedFileName
            providedFileSize
            providedFileExtension
            id
            uri
            presignedURL
            categoryName
            createdAt
          }
        }
      }
    }
  }
`

export const UPDATE_ENTITY_WITH_FILES = gql`
  mutation UpdateEntityWithFiles($updateEntityId: ID!, $input: UpdateEntityInput!, $entityFiles: [Upload!], $entityFilesMetadata: [FileMetadataInput!], $logoFile: Upload) {
    updateEntity(id: $updateEntityId, input: $input, entityFiles: $entityFiles, entityFilesMetadata: $entityFilesMetadata, logoFile: $logoFile) {
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

export const GET_ENTITY_COMMENTS = gql`
  query GetEntityComments($entityId: ID!) {
    entity(id: $entityId) {
      id
      notes {
        edges {
          node {
            id
            createdAt
            createdBy
            text
          }
        }
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
            identityHolderType
            title
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
      findings {
        edges {
          node {
            id
            displayName
            displayID
          }
        }
        totalCount
      }
      vulnerabilities {
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
      reviews {
        edges {
          node {
            id
            title
          }
        }
        totalCount
      }
      remediations {
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

export const GET_VENDOR_RISK_RATING_COUNTS = gql`
  query VendorRiskRatingCounts($where: EntityWhereInput!) {
    total: entities(where: $where) {
      totalCount
    }
    critical: entities(where: { and: [$where, { riskRating: "CRITICAL" }] }) {
      totalCount
    }
    high: entities(where: { and: [$where, { riskRating: "HIGH" }] }) {
      totalCount
    }
    medium: entities(where: { and: [$where, { riskRating: "MEDIUM" }] }) {
      totalCount
    }
    low: entities(where: { and: [$where, { riskRating: "LOW" }] }) {
      totalCount
    }
    veryLow: entities(where: { and: [$where, { riskRating: "VERY_LOW" }] }) {
      totalCount
    }
    none: entities(where: { and: [$where, { riskRating: "NONE" }] }) {
      totalCount
    }
    notScored: entities(where: { and: [$where, { riskRatingIsNil: true }] }) {
      totalCount
    }
  }
`

export const GET_VENDOR_INSTALLATIONS = gql`
  query GetVendorInstallations($entityId: ID!) {
    entity(id: $entityId) {
      id
      integrations {
        edges {
          node {
            id
            definitionID
          }
        }
      }
    }
  }
`

export const GET_VENDORS_BY_INSTALLATION = gql`
  query GetVendorsByInstallation($installationId: ID!) {
    entities(where: { hasIntegrationsWith: [{ id: $installationId }] }, first: 2) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`

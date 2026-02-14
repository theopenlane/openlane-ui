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
          internalOwnerGroupID
          internalOwnerUserID
          lastReviewedAt
          mfaEnforced
          mfaSupported
          name
          nextReviewAt
          renewalRisk
          reviewedBy
          reviewedByGroupID
          reviewedByUserID
          riskRating
          riskScore
          scopeID
          scopeName
          soc2PeriodEnd
          spendCurrency
          ssoEnforced
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
      internalOwnerGroupID
      internalOwnerUserID
      lastReviewedAt
      mfaEnforced
      mfaSupported
      name
      nextReviewAt
      renewalRisk
      reviewedBy
      reviewedByGroupID
      reviewedByUserID
      riskRating
      riskScore
      scopeID
      scopeName
      soc2PeriodEnd
      spendCurrency
      ssoEnforced
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
  mutation CreateEntity($input: CreateEntityInput!) {
    createEntity(input: $input) {
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
  mutation CreateBulkCSVEntity($input: Upload!) {
    createBulkCSVEntity(input: $input) {
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

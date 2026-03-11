import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import type { AssociationEntityConfig } from '@/components/shared/object-association/association-section'

const buildAssociationEntityConfig = <const TConfig extends AssociationEntityConfig>(config: TConfig): TConfig => config

const assetAllowedObjectTypes = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.IDENTITY_HOLDER, ObjectTypeObjects.SCAN, ObjectTypeObjects.ENTITY]
const assetInitialDataKeys = {
  scanIDs: 'scans',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
  controlIDs: 'controls',
}
const assetAssociationKeys = ['controlIDs', 'scanIDs', 'entityIDs', 'identityHolderIDs']

export const ASSET_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'asset',
  dataRootField: 'asset',
  queryKeyPrefix: 'assets',
  allowedObjectTypes: assetAllowedObjectTypes,
  initialDataKeys: assetInitialDataKeys,
  associationKeys: assetAssociationKeys,
  sectionMappings: [
    { key: 'scans', nameExtractor: (n) => n.target ?? '', displayIdExtractor: () => '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => n.fullName ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    {
      key: 'controls',
      nameExtractor: (n) => n.refCode ?? '',
      displayIdExtractor: (n) => n.displayID ?? '',
      extraFields: (n) => ({ refCode: n.refCode, description: n.description }),
    },
  ],
  dialogConfig: {
    dataRootField: 'asset',
    invalidateQueryKey: 'assets',
    successMessage: 'Asset updated',
    allowedObjectTypes: assetAllowedObjectTypes,
    initialDataKeys: assetInitialDataKeys,
  },
})

const entityAllowedObjectTypes = [ObjectTypeObjects.ASSET, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.IDENTITY_HOLDER, ObjectTypeObjects.SCAN]
const entityInitialDataKeys = {
  assetIDs: 'assets',
  scanIDs: 'scans',
  campaignIDs: 'campaigns',
  identityHolderIDs: 'identityHolders',
}
const entityAssociationKeys = ['assetIDs', 'scanIDs', 'campaignIDs', 'identityHolderIDs']

export const ENTITY_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'entity',
  dataRootField: 'entity',
  queryKeyPrefix: 'entities',
  allowedObjectTypes: entityAllowedObjectTypes,
  initialDataKeys: entityInitialDataKeys,
  associationKeys: entityAssociationKeys,
  sectionMappings: [
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'scans', nameExtractor: (n) => n.target ?? '', displayIdExtractor: () => '' },
    { key: 'campaigns', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => n.fullName ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'entity',
    invalidateQueryKey: 'entities',
    successMessage: 'Vendor updated',
    allowedObjectTypes: entityAllowedObjectTypes,
    initialDataKeys: entityInitialDataKeys,
  },
})

const identityHolderAllowedObjectTypes = [ObjectTypeObjects.ASSET, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.ENTITY, ObjectTypeObjects.TASK]
const identityHolderInitialDataKeys = {
  assetIDs: 'assets',
  entityIDs: 'entities',
  campaignIDs: 'campaigns',
  taskIDs: 'tasks',
}
const identityHolderAssociationKeys = ['assetIDs', 'entityIDs', 'campaignIDs', 'taskIDs']

export const IDENTITY_HOLDER_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'identityHolder',
  dataRootField: 'identityHolder',
  queryKeyPrefix: 'identityHolders',
  allowedObjectTypes: identityHolderAllowedObjectTypes,
  initialDataKeys: identityHolderInitialDataKeys,
  associationKeys: identityHolderAssociationKeys,
  sectionMappings: [
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'campaigns', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
  ],
  dialogConfig: {
    dataRootField: 'identityHolder',
    invalidateQueryKey: 'identityHolders',
    successMessage: 'Personnel updated',
    allowedObjectTypes: identityHolderAllowedObjectTypes,
    initialDataKeys: identityHolderInitialDataKeys,
  },
})

const findingAllowedObjectTypes = [
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.RISK,
  ObjectTypeObjects.PROGRAM,
  ObjectTypeObjects.TASK,
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.SCAN,
  ObjectTypeObjects.REMEDIATION,
  ObjectTypeObjects.REVIEW,
]
const findingInitialDataKeys = {
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  riskIDs: 'risks',
  programIDs: 'programs',
  taskIDs: 'tasks',
  assetIDs: 'assets',
  scanIDs: 'scans',
  remediationIDs: 'remediations',
  reviewIDs: 'reviews',
}
const findingAssociationKeys = ['controlIDs', 'subcontrolIDs', 'riskIDs', 'programIDs', 'taskIDs', 'assetIDs', 'scanIDs', 'remediationIDs', 'reviewIDs']

export const FINDING_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'finding',
  dataRootField: 'finding',
  queryKeyPrefix: 'findings',
  allowedObjectTypes: findingAllowedObjectTypes,
  initialDataKeys: findingInitialDataKeys,
  associationKeys: findingAssociationKeys,
  sectionMappings: [
    {
      key: 'controls',
      nameExtractor: (n) => n.refCode ?? '',
      displayIdExtractor: (n) => n.displayID ?? '',
      extraFields: (n) => ({ refCode: n.refCode, description: n.description }),
    },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'risks', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'scans', nameExtractor: (n) => n.target ?? '', displayIdExtractor: () => '' },
    { key: 'remediations', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'reviews', nameExtractor: (n) => n.title ?? '', displayIdExtractor: () => '' },
  ],
  dialogConfig: {
    dataRootField: 'finding',
    invalidateQueryKey: 'findings',
    successMessage: 'Finding updated',
    allowedObjectTypes: findingAllowedObjectTypes,
    initialDataKeys: findingInitialDataKeys,
  },
})

const reviewAllowedObjectTypes = [
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.REMEDIATION,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.TASK,
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.PROGRAM,
]
const reviewInitialDataKeys = {
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  remediationIDs: 'remediations',
  entityIDs: 'entities',
  taskIDs: 'tasks',
  assetIDs: 'assets',
  programIDs: 'programs',
}
const reviewAssociationKeys = ['controlIDs', 'subcontrolIDs', 'remediationIDs', 'entityIDs', 'taskIDs', 'assetIDs', 'programIDs']

export const REVIEW_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'review',
  dataRootField: 'review',
  queryKeyPrefix: 'reviews',
  allowedObjectTypes: reviewAllowedObjectTypes,
  initialDataKeys: reviewInitialDataKeys,
  associationKeys: reviewAssociationKeys,
  sectionMappings: [
    {
      key: 'controls',
      nameExtractor: (n) => n.refCode ?? '',
      displayIdExtractor: (n) => n.displayID ?? '',
      extraFields: (n) => ({ refCode: n.refCode, description: n.description }),
    },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'remediations', nameExtractor: (n) => n.displayID ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'review',
    invalidateQueryKey: 'reviews',
    successMessage: 'Review updated',
    allowedObjectTypes: reviewAllowedObjectTypes,
    initialDataKeys: reviewInitialDataKeys,
  },
})

import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import type { AssociationSectionConfig } from '@/components/shared/object-association/association-section'
import type { SetAssociationDialogConfig } from '@/components/shared/object-association/set-association-dialog'

type AssociationEntityConfig = AssociationSectionConfig & {
  dialogConfig: SetAssociationDialogConfig
  associationKeys: string[]
}

function buildAssociationEntityConfig(
  base: Omit<AssociationSectionConfig, 'dialogConfig'> & { associationKeys: string[]; dialogExtra: Pick<SetAssociationDialogConfig, 'dataRootField' | 'invalidateQueryKey' | 'successMessage'> },
): AssociationEntityConfig {
  const { dialogExtra, ...rest } = base
  return {
    ...rest,
    dialogConfig: {
      ...dialogExtra,
      allowedObjectTypes: rest.allowedObjectTypes,
      initialDataKeys: rest.initialDataKeys,
    },
  }
}

export const ASSET_ASSOCIATION_CONFIG: AssociationEntityConfig = buildAssociationEntityConfig({
  entityType: 'asset',
  dataRootField: 'asset',
  queryKeyPrefix: 'assets',
  allowedObjectTypes: [ObjectTypeObjects.SCAN, ObjectTypeObjects.ENTITY, ObjectTypeObjects.IDENTITY_HOLDER, ObjectTypeObjects.CONTROL],
  initialDataKeys: {
    scanIDs: 'scans',
    entityIDs: 'entities',
    identityHolderIDs: 'identityHolders',
    controlIDs: 'controls',
  },
  associationKeys: ['controlIDs', 'scanIDs', 'entityIDs', 'identityHolderIDs'],
  sectionMappings: [
    { key: 'scans', nameExtractor: (n) => (n.target as string) ?? '', displayIdExtractor: () => '' },
    { key: 'entities', nameExtractor: (n) => (n.name as string) ?? '', displayIdExtractor: (n) => (n.displayName as string) ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => (n.fullName as string) ?? '', displayIdExtractor: (n) => (n.displayID as string) ?? '' },
    {
      key: 'controls',
      nameExtractor: (n) => (n.refCode as string) ?? '',
      displayIdExtractor: (n) => (n.displayID as string) ?? '',
      extraFields: (n) => ({ refCode: n.refCode, description: n.description }),
    },
  ],
  dialogExtra: {
    dataRootField: 'asset',
    invalidateQueryKey: 'assets',
    successMessage: 'Asset updated',
  },
})

export const ENTITY_ASSOCIATION_CONFIG: AssociationEntityConfig = buildAssociationEntityConfig({
  entityType: 'entity',
  dataRootField: 'entity',
  queryKeyPrefix: 'entities',
  allowedObjectTypes: [ObjectTypeObjects.ASSET, ObjectTypeObjects.SCAN, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.IDENTITY_HOLDER],
  initialDataKeys: {
    assetIDs: 'assets',
    scanIDs: 'scans',
    campaignIDs: 'campaigns',
    identityHolderIDs: 'identityHolders',
  },
  associationKeys: ['assetIDs', 'scanIDs', 'campaignIDs', 'identityHolderIDs'],
  sectionMappings: [
    { key: 'assets', nameExtractor: (n) => (n.name as string) ?? '', displayIdExtractor: (n) => (n.displayName as string) ?? '' },
    { key: 'scans', nameExtractor: (n) => (n.target as string) ?? '', displayIdExtractor: () => '' },
    { key: 'campaigns', nameExtractor: (n) => (n.name as string) ?? '', displayIdExtractor: (n) => (n.displayID as string) ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => (n.fullName as string) ?? '', displayIdExtractor: (n) => (n.displayID as string) ?? '' },
  ],
  dialogExtra: {
    dataRootField: 'entity',
    invalidateQueryKey: 'entities',
    successMessage: 'Vendor updated',
  },
})

export const IDENTITY_HOLDER_ASSOCIATION_CONFIG: AssociationEntityConfig = buildAssociationEntityConfig({
  entityType: 'identityHolder',
  dataRootField: 'identityHolder',
  queryKeyPrefix: 'identityHolders',
  allowedObjectTypes: [ObjectTypeObjects.ASSET, ObjectTypeObjects.ENTITY, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.TASK],
  initialDataKeys: {
    assetIDs: 'assets',
    entityIDs: 'entities',
    campaignIDs: 'campaigns',
    taskIDs: 'tasks',
  },
  associationKeys: ['assetIDs', 'entityIDs', 'campaignIDs', 'taskIDs'],
  sectionMappings: [
    { key: 'assets', nameExtractor: (n) => (n.name as string) ?? '', displayIdExtractor: (n) => (n.displayName as string) ?? '' },
    { key: 'entities', nameExtractor: (n) => (n.name as string) ?? '', displayIdExtractor: (n) => (n.displayName as string) ?? '' },
    { key: 'campaigns', nameExtractor: (n) => (n.name as string) ?? '', displayIdExtractor: (n) => (n.displayID as string) ?? '' },
    { key: 'tasks', nameExtractor: (n) => (n.title as string) ?? '', displayIdExtractor: (n) => (n.displayID as string) ?? '', extraFields: (n) => ({ title: n.title }) },
  ],
  dialogExtra: {
    dataRootField: 'identityHolder',
    invalidateQueryKey: 'identityHolders',
    successMessage: 'Personnel updated',
  },
})

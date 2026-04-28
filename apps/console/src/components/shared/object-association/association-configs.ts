import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import type { AssociationEntityConfig } from '@/components/shared/object-association/association-section'
import { buildRelatedInvalidateKeys } from '@/components/shared/object-association/utils'

const buildAssociationEntityConfig = <const TConfig extends AssociationEntityConfig>(config: TConfig): TConfig => config

const assetAllowedObjectTypes = [
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.IDENTITY_HOLDER,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.SCAN,
  ObjectTypeObjects.ENTITY,
]
const assetInitialDataKeys = {
  scanIDs: 'scans',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  internalPolicyIDs: 'internalPolicies',
}
const assetAssociationKeys = ['controlIDs', 'subcontrolIDs', 'internalPolicyIDs', 'scanIDs', 'entityIDs', 'identityHolderIDs'] as const satisfies readonly (keyof typeof assetInitialDataKeys)[]

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
      extraFields: (n) => ({ description: n.description }),
    },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'asset',
    invalidateQueryKey: 'assets',
    successMessage: 'Asset updated',
    allowedObjectTypes: assetAllowedObjectTypes,
    initialDataKeys: assetInitialDataKeys,
  },
})

const entityAllowedObjectTypes = [
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.CAMPAIGN,
  ObjectTypeObjects.IDENTITY_HOLDER,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.SCAN,
  ObjectTypeObjects.SUB_CONTROL,
]
const entityInitialDataKeys = {
  assetIDs: 'assets',
  scanIDs: 'scans',
  campaignIDs: 'campaigns',
  identityHolderIDs: 'identityHolders',
  internalPolicyIDs: 'internalPolicies',
  subcontrolIDs: 'subcontrols',
}
const entityAssociationKeys = ['assetIDs', 'internalPolicyIDs', 'subcontrolIDs', 'scanIDs', 'campaignIDs', 'identityHolderIDs'] as const satisfies readonly (keyof typeof entityInitialDataKeys)[]

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
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
  ],
  dialogConfig: {
    dataRootField: 'entity',
    invalidateQueryKey: 'entities',
    successMessage: 'Vendor updated',
    allowedObjectTypes: entityAllowedObjectTypes,
    initialDataKeys: entityInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(entityInitialDataKeys),
  },
})

const identityHolderAllowedObjectTypes = [
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.CAMPAIGN,
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.TASK,
]
const identityHolderInitialDataKeys = {
  assetIDs: 'assets',
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  entityIDs: 'entities',
  campaignIDs: 'campaigns',
  internalPolicyIDs: 'internalPolicies',
  taskIDs: 'tasks',
}
const identityHolderAssociationKeys = [
  'assetIDs',
  'controlIDs',
  'subcontrolIDs',
  'entityIDs',
  'campaignIDs',
  'internalPolicyIDs',
  'taskIDs',
] as const satisfies readonly (keyof typeof identityHolderInitialDataKeys)[]

export const IDENTITY_HOLDER_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'identityHolder',
  dataRootField: 'identityHolder',
  queryKeyPrefix: 'identityHolders',
  allowedObjectTypes: identityHolderAllowedObjectTypes,
  initialDataKeys: identityHolderInitialDataKeys,
  associationKeys: identityHolderAssociationKeys,
  sectionMappings: [
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    {
      key: 'controls',
      nameExtractor: (n) => n.refCode ?? '',
      displayIdExtractor: (n) => n.displayID ?? '',
      extraFields: (n) => ({ description: n.description }),
    },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'campaigns', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
  ],
  dialogConfig: {
    dataRootField: 'identityHolder',
    invalidateQueryKey: 'identityHolders',
    successMessage: 'Personnel updated',
    allowedObjectTypes: identityHolderAllowedObjectTypes,
    initialDataKeys: identityHolderInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(identityHolderInitialDataKeys),
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
  ObjectTypeObjects.VULNERABILITY,
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
  vulnerabilityIDs: 'vulnerabilities',
}
const findingAssociationKeys = [
  'controlIDs',
  'subcontrolIDs',
  'riskIDs',
  'programIDs',
  'taskIDs',
  'assetIDs',
  'scanIDs',
  'remediationIDs',
  'reviewIDs',
  'vulnerabilityIDs',
] as const satisfies readonly (keyof typeof findingInitialDataKeys)[]

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
      extraFields: (n) => ({ description: n.description }),
    },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'risks', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'scans', nameExtractor: (n) => n.target ?? '', displayIdExtractor: () => '' },
    { key: 'remediations', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'reviews', nameExtractor: (n) => n.title ?? '', displayIdExtractor: () => '' },
    { key: 'vulnerabilities', nameExtractor: (n) => n.displayName ?? n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'finding',
    invalidateQueryKey: 'findings',
    successMessage: 'Finding updated',
    allowedObjectTypes: findingAllowedObjectTypes,
    initialDataKeys: findingInitialDataKeys,
  },
})

const remediationAllowedObjectTypes = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.FINDING, ObjectTypeObjects.VULNERABILITY]
const remediationInitialDataKeys = {
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  findingIDs: 'findings',
  vulnerabilityIDs: 'vulnerabilities',
}
const remediationAssociationKeys = ['controlIDs', 'subcontrolIDs', 'findingIDs', 'vulnerabilityIDs'] as const satisfies readonly (keyof typeof remediationInitialDataKeys)[]

export const REMEDIATION_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'remediation',
  dataRootField: 'remediation',
  queryKeyPrefix: 'remediations',
  allowedObjectTypes: remediationAllowedObjectTypes,
  initialDataKeys: remediationInitialDataKeys,
  associationKeys: remediationAssociationKeys,
  sectionMappings: [
    { key: 'controls', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'findings', nameExtractor: (n) => n.displayName ?? n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'vulnerabilities', nameExtractor: (n) => n.displayName ?? n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'remediation',
    invalidateQueryKey: 'remediations',
    successMessage: 'Remediation updated',
    allowedObjectTypes: remediationAllowedObjectTypes,
    initialDataKeys: remediationInitialDataKeys,
  },
})

const vulnerabilityAllowedObjectTypes = [
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.FINDING,
  ObjectTypeObjects.REMEDIATION,
  ObjectTypeObjects.REVIEW,
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.TASK,
]
const vulnerabilityInitialDataKeys = {
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  findingIDs: 'findings',
  remediationIDs: 'remediations',
  reviewIDs: 'reviews',
  assetIDs: 'assets',
  taskIDs: 'tasks',
}
const vulnerabilityAssociationKeys = [
  'controlIDs',
  'subcontrolIDs',
  'findingIDs',
  'remediationIDs',
  'reviewIDs',
  'assetIDs',
  'taskIDs',
] as const satisfies readonly (keyof typeof vulnerabilityInitialDataKeys)[]

export const VULNERABILITY_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'vulnerability',
  dataRootField: 'vulnerability',
  queryKeyPrefix: 'vulnerabilities',
  allowedObjectTypes: vulnerabilityAllowedObjectTypes,
  initialDataKeys: vulnerabilityInitialDataKeys,
  associationKeys: vulnerabilityAssociationKeys,
  sectionMappings: [
    { key: 'controls', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'findings', nameExtractor: (n) => n.displayName ?? n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'remediations', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'reviews', nameExtractor: (n) => n.title ?? '', displayIdExtractor: () => '' },
    { key: 'assets', nameExtractor: (n) => n.displayName ?? n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
  ],
  dialogConfig: {
    dataRootField: 'vulnerability',
    invalidateQueryKey: 'vulnerabilities',
    successMessage: 'Vulnerability updated',
    allowedObjectTypes: vulnerabilityAllowedObjectTypes,
    initialDataKeys: vulnerabilityInitialDataKeys,
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
  riskIDs: 'risks',
}
const reviewAssociationKeys = [
  'controlIDs',
  'subcontrolIDs',
  'remediationIDs',
  'entityIDs',
  'taskIDs',
  'assetIDs',
  'programIDs',
  'riskIDs',
] as const satisfies readonly (keyof typeof reviewInitialDataKeys)[]

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
      extraFields: (n) => ({ description: n.description }),
    },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'remediations', nameExtractor: (n) => n.displayID ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title }) },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    {
      key: 'risks',
      nameExtractor: (n) => n.name ?? '',
      displayIdExtractor: (n) => n.displayID ?? '',
      extraFields: (n) => ({ description: n.description }),
    },
  ],
  dialogConfig: {
    dataRootField: 'review',
    invalidateQueryKey: 'reviews',
    successMessage: 'Review updated',
    allowedObjectTypes: reviewAllowedObjectTypes,
    initialDataKeys: reviewInitialDataKeys,
  },
})

const controlAllowedObjectTypes = [
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.CAMPAIGN,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.FINDING,
  ObjectTypeObjects.IDENTITY_HOLDER,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.PROCEDURE,
  ObjectTypeObjects.PROGRAM,
  ObjectTypeObjects.REMEDIATION,
  ObjectTypeObjects.REVIEW,
  ObjectTypeObjects.RISK,
  ObjectTypeObjects.SCAN,
  ObjectTypeObjects.TASK,
]
const controlInitialDataKeys = {
  internalPolicyIDs: 'internalPolicies',
  procedureIDs: 'procedures',
  taskIDs: 'tasks',
  programIDs: 'programs',
  riskIDs: 'risks',
  assetIDs: 'assets',
  scanIDs: 'scans',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
  campaignIDs: 'campaigns',
  remediationIDs: 'remediations',
  reviewIDs: 'reviews',
  findingIDs: 'findings',
}
const controlAssociationKeys = [
  'internalPolicyIDs',
  'procedureIDs',
  'taskIDs',
  'programIDs',
  'riskIDs',
  'assetIDs',
  'scanIDs',
  'entityIDs',
  'identityHolderIDs',
  'campaignIDs',
  'remediationIDs',
  'reviewIDs',
  'findingIDs',
] as const satisfies readonly (keyof typeof controlInitialDataKeys)[]

export const CONTROL_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'control',
  dataRootField: 'control',
  queryKeyPrefix: 'controls',
  allowedObjectTypes: controlAllowedObjectTypes,
  initialDataKeys: controlInitialDataKeys,
  associationKeys: controlAssociationKeys,
  sectionMappings: [
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ summary: n.summary }) },
    { key: 'procedures', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ summary: n.summary }) },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title, details: n.details }) },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'risks', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ details: n.details }) },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'scans', nameExtractor: (n) => n.target ?? '', displayIdExtractor: () => '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => n.fullName ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'campaigns', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'remediations', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'reviews', nameExtractor: (n) => n.title ?? '', displayIdExtractor: () => '' },
    { key: 'findings', nameExtractor: (n) => n.displayName ?? n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'control',
    invalidateQueryKey: 'controls',
    successMessage: 'Control updated',
    allowedObjectTypes: controlAllowedObjectTypes,
    initialDataKeys: controlInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(controlInitialDataKeys),
  },
})

const subcontrolAllowedObjectTypes = [
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.IDENTITY_HOLDER,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.PROCEDURE,
  ObjectTypeObjects.RISK,
  ObjectTypeObjects.TASK,
]
const subcontrolInitialDataKeys = {
  internalPolicyIDs: 'internalPolicies',
  procedureIDs: 'procedures',
  taskIDs: 'tasks',
  riskIDs: 'risks',
  assetIDs: 'assets',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
}
const subcontrolAssociationKeys = [
  'internalPolicyIDs',
  'procedureIDs',
  'taskIDs',
  'riskIDs',
  'assetIDs',
  'entityIDs',
  'identityHolderIDs',
] as const satisfies readonly (keyof typeof subcontrolInitialDataKeys)[]

export const SUBCONTROL_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'subcontrol',
  dataRootField: 'subcontrol',
  queryKeyPrefix: 'subcontrols',
  allowedObjectTypes: subcontrolAllowedObjectTypes,
  initialDataKeys: subcontrolInitialDataKeys,
  associationKeys: subcontrolAssociationKeys,
  sectionMappings: [
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'procedures', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title, details: n.details }) },
    { key: 'risks', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ details: n.details }) },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => n.fullName ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'subcontrol',
    invalidateQueryKey: 'subcontrols',
    successMessage: 'Subcontrol updated',
    allowedObjectTypes: subcontrolAllowedObjectTypes,
    initialDataKeys: subcontrolInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(subcontrolInitialDataKeys),
  },
})

const policyAllowedObjectTypes = [
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.CONTROL_OBJECTIVE,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.IDENTITY_HOLDER,
  ObjectTypeObjects.PROCEDURE,
  ObjectTypeObjects.PROGRAM,
  ObjectTypeObjects.RISK,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.TASK,
]
const policyInitialDataKeys = {
  procedureIDs: 'procedures',
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  programIDs: 'programs',
  taskIDs: 'tasks',
  controlObjectiveIDs: 'controlObjectives',
  riskIDs: 'risks',
  assetIDs: 'assets',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
}
const policyAssociationKeys = [
  'procedureIDs',
  'controlIDs',
  'subcontrolIDs',
  'programIDs',
  'taskIDs',
  'controlObjectiveIDs',
  'riskIDs',
  'assetIDs',
  'entityIDs',
  'identityHolderIDs',
] as const satisfies readonly (keyof typeof policyInitialDataKeys)[]

export const POLICY_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'policy',
  dataRootField: 'internalPolicy',
  queryKeyPrefix: 'internalPolicies',
  allowedObjectTypes: policyAllowedObjectTypes,
  initialDataKeys: policyInitialDataKeys,
  associationKeys: policyAssociationKeys,
  sectionMappings: [
    { key: 'procedures', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ summary: n.summary }) },
    { key: 'controls', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title, details: n.details }) },
    { key: 'controlObjectives', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'risks', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'identityHolders', nameExtractor: (n) => n.fullName ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
  ],
  dialogConfig: {
    dataRootField: 'internalPolicy',
    invalidateQueryKey: 'internalPolicies',
    successMessage: 'Policy updated',
    allowedObjectTypes: policyAllowedObjectTypes,
    initialDataKeys: policyInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(policyInitialDataKeys),
  },
})

const procedureAllowedObjectTypes = [
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.PROGRAM,
  ObjectTypeObjects.RISK,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.TASK,
]
const procedureInitialDataKeys = {
  internalPolicyIDs: 'internalPolicies',
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  programIDs: 'programs',
  taskIDs: 'tasks',
  riskIDs: 'risks',
}
const procedureAssociationKeys = ['internalPolicyIDs', 'controlIDs', 'subcontrolIDs', 'programIDs', 'taskIDs', 'riskIDs'] as const satisfies readonly (keyof typeof procedureInitialDataKeys)[]

export const PROCEDURE_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'procedure',
  dataRootField: 'procedure',
  queryKeyPrefix: 'procedures',
  allowedObjectTypes: procedureAllowedObjectTypes,
  initialDataKeys: procedureInitialDataKeys,
  associationKeys: procedureAssociationKeys,
  sectionMappings: [
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ summary: n.summary }) },
    { key: 'controls', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title, details: n.details }) },
    { key: 'risks', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ details: n.details }) },
  ],
  dialogConfig: {
    dataRootField: 'procedure',
    invalidateQueryKey: 'procedures',
    successMessage: 'Procedure updated',
    allowedObjectTypes: procedureAllowedObjectTypes,
    initialDataKeys: procedureInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(procedureInitialDataKeys),
  },
})

const riskAllowedObjectTypes = [
  ObjectTypeObjects.ACTION_PLAN,
  ObjectTypeObjects.ASSET,
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.PROCEDURE,
  ObjectTypeObjects.PROGRAM,
  ObjectTypeObjects.SCAN,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.TASK,
]
const riskInitialDataKeys = {
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  programIDs: 'programs',
  taskIDs: 'tasks',
  internalPolicyIDs: 'internalPolicies',
  procedureIDs: 'procedures',
  assetIDs: 'assets',
  entityIDs: 'entities',
  scanIDs: 'scans',
  actionPlanIDs: 'actionPlans',
}
const riskAssociationKeys = [
  'controlIDs',
  'subcontrolIDs',
  'programIDs',
  'taskIDs',
  'internalPolicyIDs',
  'procedureIDs',
  'assetIDs',
  'entityIDs',
  'scanIDs',
  'actionPlanIDs',
] as const satisfies readonly (keyof typeof riskInitialDataKeys)[]

export const RISK_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'risk',
  dataRootField: 'risk',
  queryKeyPrefix: 'risks',
  allowedObjectTypes: riskAllowedObjectTypes,
  initialDataKeys: riskInitialDataKeys,
  associationKeys: riskAssociationKeys,
  sectionMappings: [
    { key: 'controls', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'subcontrols', nameExtractor: (n) => n.refCode ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'programs', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ description: n.description }) },
    { key: 'tasks', nameExtractor: (n) => n.title ?? '', displayIdExtractor: (n) => n.displayID ?? '', extraFields: (n) => ({ title: n.title, details: n.details }) },
    { key: 'internalPolicies', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'procedures', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayID ?? '' },
    { key: 'assets', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'entities', nameExtractor: (n) => n.name ?? '', displayIdExtractor: (n) => n.displayName ?? '' },
    { key: 'scans', nameExtractor: (n) => n.target ?? '', displayIdExtractor: () => '' },
    { key: 'actionPlans', nameExtractor: (n) => n.name ?? '', displayIdExtractor: () => '' },
  ],
  dialogConfig: {
    dataRootField: 'risk',
    invalidateQueryKey: 'risks',
    successMessage: 'Risk updated',
    allowedObjectTypes: riskAllowedObjectTypes,
    initialDataKeys: riskInitialDataKeys,
    relatedInvalidateQueryKeys: buildRelatedInvalidateKeys(riskInitialDataKeys),
  },
})

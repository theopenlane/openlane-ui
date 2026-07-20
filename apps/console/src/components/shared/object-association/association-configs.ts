import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import type { AssociationEntityConfig, AssociationNode } from '@/components/shared/object-association/association-section'
import type { TBaseAssociatedNode } from '@/components/shared/object-association/types/object-association-types'
import { buildRelatedInvalidateKeys } from '@/components/shared/object-association/utils'

const buildAssociationEntityConfig = <const TConfig extends AssociationEntityConfig>(config: TConfig): TConfig => config

type ExtraFieldsExtractor = (node: AssociationNode) => Partial<TBaseAssociatedNode>

const SECTION_MAPPINGS = {
  actionPlans: { key: 'actionPlans', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: () => '' },
  assets: { key: 'assets', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayName ?? '' },
  campaigns: { key: 'campaigns', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  controlObjectives: { key: 'controlObjectives', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  controls: {
    key: 'controls',
    nameExtractor: (n: AssociationNode) => n.refCode ?? '',
    displayIdExtractor: (n: AssociationNode) => n.displayID ?? '',
    extraFields: (n: AssociationNode) => ({ description: n.description }),
  },
  entities: { key: 'entities', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayName ?? '' },
  findings: { key: 'findings', nameExtractor: (n: AssociationNode) => n.displayName ?? n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  identityHolders: { key: 'identityHolders', nameExtractor: (n: AssociationNode) => n.fullName ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  internalPolicies: { key: 'internalPolicies', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  procedures: { key: 'procedures', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  programs: { key: 'programs', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  remediations: { key: 'remediations', nameExtractor: (n: AssociationNode) => n.title ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  reviews: { key: 'reviews', nameExtractor: (n: AssociationNode) => n.title ?? '', displayIdExtractor: () => '' },
  risks: { key: 'risks', nameExtractor: (n: AssociationNode) => n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
  scans: { key: 'scans', nameExtractor: (n: AssociationNode) => n.target ?? '', displayIdExtractor: () => '' },
  subcontrols: {
    key: 'subcontrols',
    nameExtractor: (n: AssociationNode) => n.refCode ?? '',
    displayIdExtractor: (n: AssociationNode) => n.displayID ?? '',
    extraFields: (n: AssociationNode) => ({ description: n.description }),
  },
  tasks: {
    key: 'tasks',
    nameExtractor: (n: AssociationNode) => n.title ?? '',
    displayIdExtractor: (n: AssociationNode) => n.displayID ?? '',
    extraFields: (n: AssociationNode) => ({ title: n.title }),
  },
  vulnerabilities: { key: 'vulnerabilities', nameExtractor: (n: AssociationNode) => n.displayName ?? n.name ?? '', displayIdExtractor: (n: AssociationNode) => n.displayID ?? '' },
} as const

const withExtras = <TMapping extends { key: string; extraFields?: ExtraFieldsExtractor }>(mapping: TMapping, extraFields: ExtraFieldsExtractor) => ({
  ...mapping,
  extraFields: (node: AssociationNode) => ({ ...mapping.extraFields?.(node), ...extraFields(node) }),
})

const assetAllowedObjectTypes = [
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.IDENTITY_HOLDER,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.SCAN,
  ObjectTypeObjects.ENTITY,
  ObjectTypeObjects.FINDING,
  ObjectTypeObjects.VULNERABILITY,
  ObjectTypeObjects.REVIEW,
  ObjectTypeObjects.REMEDIATION,
]
const assetInitialDataKeys = {
  scanIDs: 'scans',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
  controlIDs: 'controls',
  subcontrolIDs: 'subcontrols',
  internalPolicyIDs: 'internalPolicies',
  findingIDs: 'findings',
  vulnerabilityIDs: 'vulnerabilities',
  reviewIDs: 'reviews',
  remediationIDs: 'remediations',
}
const assetAssociationKeys = [
  'controlIDs',
  'subcontrolIDs',
  'internalPolicyIDs',
  'scanIDs',
  'entityIDs',
  'identityHolderIDs',
  'findingIDs',
  'vulnerabilityIDs',
  'reviewIDs',
  'remediationIDs',
] as const satisfies readonly (keyof typeof assetInitialDataKeys)[]

export const ASSET_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'asset',
  dataRootField: 'asset',
  queryKeyPrefix: 'assets',
  allowedObjectTypes: assetAllowedObjectTypes,
  initialDataKeys: assetInitialDataKeys,
  associationKeys: assetAssociationKeys,
  sectionMappings: [
    SECTION_MAPPINGS.scans,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.identityHolders,
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    SECTION_MAPPINGS.internalPolicies,
    SECTION_MAPPINGS.findings,
    SECTION_MAPPINGS.vulnerabilities,
    SECTION_MAPPINGS.reviews,
    SECTION_MAPPINGS.remediations,
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
  ObjectTypeObjects.FINDING,
  ObjectTypeObjects.VULNERABILITY,
  ObjectTypeObjects.REVIEW,
  ObjectTypeObjects.REMEDIATION,
]
const entityInitialDataKeys = {
  assetIDs: 'assets',
  scanIDs: 'scans',
  campaignIDs: 'campaigns',
  identityHolderIDs: 'identityHolders',
  internalPolicyIDs: 'internalPolicies',
  subcontrolIDs: 'subcontrols',
  findingIDs: 'findings',
  vulnerabilityIDs: 'vulnerabilities',
  reviewIDs: 'reviews',
  remediationIDs: 'remediations',
}
const entityAssociationKeys = [
  'assetIDs',
  'internalPolicyIDs',
  'subcontrolIDs',
  'scanIDs',
  'campaignIDs',
  'identityHolderIDs',
  'findingIDs',
  'vulnerabilityIDs',
  'reviewIDs',
  'remediationIDs',
] as const satisfies readonly (keyof typeof entityInitialDataKeys)[]

export const ENTITY_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'entity',
  dataRootField: 'entity',
  queryKeyPrefix: 'entities',
  allowedObjectTypes: entityAllowedObjectTypes,
  initialDataKeys: entityInitialDataKeys,
  associationKeys: entityAssociationKeys,
  sectionMappings: [
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.scans,
    SECTION_MAPPINGS.campaigns,
    SECTION_MAPPINGS.identityHolders,
    SECTION_MAPPINGS.internalPolicies,
    SECTION_MAPPINGS.subcontrols,
    SECTION_MAPPINGS.findings,
    SECTION_MAPPINGS.vulnerabilities,
    SECTION_MAPPINGS.reviews,
    SECTION_MAPPINGS.remediations,
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
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.campaigns,
    SECTION_MAPPINGS.internalPolicies,
    SECTION_MAPPINGS.tasks,
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
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    SECTION_MAPPINGS.risks,
    SECTION_MAPPINGS.programs,
    SECTION_MAPPINGS.tasks,
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.scans,
    SECTION_MAPPINGS.remediations,
    SECTION_MAPPINGS.reviews,
    SECTION_MAPPINGS.vulnerabilities,
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
  sectionMappings: [SECTION_MAPPINGS.controls, SECTION_MAPPINGS.subcontrols, SECTION_MAPPINGS.findings, SECTION_MAPPINGS.vulnerabilities],
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
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    SECTION_MAPPINGS.findings,
    SECTION_MAPPINGS.remediations,
    SECTION_MAPPINGS.reviews,
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.tasks,
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
  ObjectTypeObjects.RISK,
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
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    SECTION_MAPPINGS.remediations,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.tasks,
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.programs,
    withExtras(SECTION_MAPPINGS.risks, (n) => ({ description: n.description })),
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
  ObjectTypeObjects.VULNERABILITY,
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
  vulnerabilityIDs: 'vulnerabilities',
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
  'vulnerabilityIDs',
] as const satisfies readonly (keyof typeof controlInitialDataKeys)[]

export const CONTROL_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'control',
  dataRootField: 'control',
  queryKeyPrefix: 'controls',
  allowedObjectTypes: controlAllowedObjectTypes,
  initialDataKeys: controlInitialDataKeys,
  associationKeys: controlAssociationKeys,
  sectionMappings: [
    withExtras(SECTION_MAPPINGS.internalPolicies, (n) => ({ summary: n.summary })),
    withExtras(SECTION_MAPPINGS.procedures, (n) => ({ summary: n.summary })),
    withExtras(SECTION_MAPPINGS.tasks, (n) => ({ details: n.details })),
    withExtras(SECTION_MAPPINGS.programs, (n) => ({ description: n.description })),
    withExtras(SECTION_MAPPINGS.risks, (n) => ({ details: n.details })),
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.scans,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.identityHolders,
    SECTION_MAPPINGS.campaigns,
    SECTION_MAPPINGS.remediations,
    SECTION_MAPPINGS.reviews,
    SECTION_MAPPINGS.findings,
    SECTION_MAPPINGS.vulnerabilities,
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
  ObjectTypeObjects.VULNERABILITY,
  ObjectTypeObjects.FINDING,
]
const subcontrolInitialDataKeys = {
  internalPolicyIDs: 'internalPolicies',
  procedureIDs: 'procedures',
  taskIDs: 'tasks',
  riskIDs: 'risks',
  assetIDs: 'assets',
  entityIDs: 'entities',
  identityHolderIDs: 'identityHolders',
  vulnerabilityIDs: 'vulnerabilities',
  findingIDs: 'findings',
}
const subcontrolAssociationKeys = [
  'internalPolicyIDs',
  'procedureIDs',
  'taskIDs',
  'riskIDs',
  'assetIDs',
  'entityIDs',
  'identityHolderIDs',
  'vulnerabilityIDs',
  'findingIDs',
] as const satisfies readonly (keyof typeof subcontrolInitialDataKeys)[]

export const SUBCONTROL_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'subcontrol',
  dataRootField: 'subcontrol',
  queryKeyPrefix: 'subcontrols',
  allowedObjectTypes: subcontrolAllowedObjectTypes,
  initialDataKeys: subcontrolInitialDataKeys,
  associationKeys: subcontrolAssociationKeys,
  sectionMappings: [
    SECTION_MAPPINGS.internalPolicies,
    SECTION_MAPPINGS.procedures,
    withExtras(SECTION_MAPPINGS.tasks, (n) => ({ details: n.details })),
    withExtras(SECTION_MAPPINGS.risks, (n) => ({ details: n.details })),
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.identityHolders,
    SECTION_MAPPINGS.vulnerabilities,
    SECTION_MAPPINGS.findings,
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
    withExtras(SECTION_MAPPINGS.procedures, (n) => ({ summary: n.summary })),
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    withExtras(SECTION_MAPPINGS.programs, (n) => ({ description: n.description })),
    withExtras(SECTION_MAPPINGS.tasks, (n) => ({ details: n.details })),
    SECTION_MAPPINGS.controlObjectives,
    SECTION_MAPPINGS.risks,
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.identityHolders,
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
    withExtras(SECTION_MAPPINGS.internalPolicies, (n) => ({ summary: n.summary })),
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    withExtras(SECTION_MAPPINGS.programs, (n) => ({ description: n.description })),
    withExtras(SECTION_MAPPINGS.tasks, (n) => ({ details: n.details })),
    withExtras(SECTION_MAPPINGS.risks, (n) => ({ details: n.details })),
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
  ObjectTypeObjects.VULNERABILITY,
  ObjectTypeObjects.FINDING,
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
  vulnerabilityIDs: 'vulnerabilities',
  findingIDs: 'findings',
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
  'vulnerabilityIDs',
  'findingIDs',
] as const satisfies readonly (keyof typeof riskInitialDataKeys)[]

export const RISK_ASSOCIATION_CONFIG = buildAssociationEntityConfig({
  entityType: 'risk',
  dataRootField: 'risk',
  queryKeyPrefix: 'risks',
  allowedObjectTypes: riskAllowedObjectTypes,
  initialDataKeys: riskInitialDataKeys,
  associationKeys: riskAssociationKeys,
  sectionMappings: [
    SECTION_MAPPINGS.controls,
    SECTION_MAPPINGS.subcontrols,
    withExtras(SECTION_MAPPINGS.programs, (n) => ({ description: n.description })),
    withExtras(SECTION_MAPPINGS.tasks, (n) => ({ details: n.details })),
    SECTION_MAPPINGS.internalPolicies,
    SECTION_MAPPINGS.procedures,
    SECTION_MAPPINGS.assets,
    SECTION_MAPPINGS.entities,
    SECTION_MAPPINGS.scans,
    SECTION_MAPPINGS.actionPlans,
    SECTION_MAPPINGS.vulnerabilities,
    SECTION_MAPPINGS.findings,
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

// System details use a simple multi-select card rather than the graph-based AssociationSection UI,
// so only the association keys are needed here (no sectionMappings/dialogConfig)
export const SYSTEM_DETAIL_ASSOCIATION_KEYS = ['platformIDs', 'programIDs'] as const

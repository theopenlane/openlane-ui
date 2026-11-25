import { ObjectTypes } from '@repo/codegen/src/type-names'
import {
  GET_DEMO_DATA_AUTOMATION_PREVIEW,
  GET_DEMO_DATA_COMPLIANCE_PREVIEW,
  GET_DEMO_DATA_EXPOSURE_PREVIEW,
  GET_DEMO_DATA_ORGANIZATION_SETTINGS_PREVIEW,
  GET_DEMO_DATA_REGISTRY_PREVIEW,
} from '@repo/codegen/query/demo-data'
import { type GetDemoDataTypeCountsQuery } from '@repo/codegen/src/schema'

export type TDemoDataTypeKey = Exclude<keyof GetDemoDataTypeCountsQuery, '__typename'>
export type TDemoDataTypeFlag = `with${Capitalize<TDemoDataTypeKey>}`

type TDemoDataTypeIdentity = { [Key in TDemoDataTypeKey]: { key: Key; flag: `with${Capitalize<Key>}` } }[TDemoDataTypeKey]

export type TDemoDataType = TDemoDataTypeIdentity & {
  label: string
  objectType: ObjectTypes
  schemas: string[]
  detailHeader: string
  isDetailFreeText?: boolean
  recommended?: boolean
  alsoKeeps?: string
  requires?: TDemoDataTypeKey[]
}

export type TDemoDataTypeGroup = {
  label: string
  previewDocument: string
  types: TDemoDataType[]
}

const USES_CUSTOM_ENUMS: TDemoDataTypeKey[] = ['customTypeEnums']

export const DEMO_DATA_TYPE_GROUPS: TDemoDataTypeGroup[] = [
  {
    label: 'Compliance',
    previewDocument: GET_DEMO_DATA_COMPLIANCE_PREVIEW,
    types: [
      { key: 'programs', label: 'Programs', flag: 'withPrograms', objectType: ObjectTypes.PROGRAM, schemas: ['program'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      {
        key: 'controls',
        label: 'Controls',
        flag: 'withControls',
        objectType: ObjectTypes.CONTROL,
        schemas: ['control', 'mapped_control', 'control_objective', 'control_implementation'],
        detailHeader: 'Status',
        alsoKeeps: 'their objectives, implementations and mappings',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'evidences', label: 'Evidence', flag: 'withEvidences', objectType: ObjectTypes.EVIDENCE, schemas: ['evidence'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      {
        key: 'internalPolicies',
        label: 'Policies',
        flag: 'withInternalPolicies',
        objectType: ObjectTypes.INTERNAL_POLICY,
        schemas: ['internal_policy'],
        detailHeader: 'Status',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'procedures', label: 'Procedures', flag: 'withProcedures', objectType: ObjectTypes.PROCEDURE, schemas: ['procedure'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
    ],
  },
  {
    label: 'Registry',
    previewDocument: GET_DEMO_DATA_REGISTRY_PREVIEW,
    types: [
      { key: 'platforms', label: 'Platforms', flag: 'withPlatforms', objectType: ObjectTypes.PLATFORM, schemas: ['platform'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'systemDetails', label: 'System Details', flag: 'withSystemDetails', objectType: ObjectTypes.SYSTEM_DETAIL, schemas: ['system_detail'], detailHeader: 'Sensitivity' },
      { key: 'assets', label: 'Assets', flag: 'withAssets', objectType: ObjectTypes.ASSET, schemas: ['asset'], detailHeader: 'Type', requires: USES_CUSTOM_ENUMS },
      {
        key: 'entities',
        label: 'Vendors',
        flag: 'withEntities',
        objectType: ObjectTypes.ENTITY,
        schemas: ['entity', 'vendor_risk_score'],
        detailHeader: 'Status',
        alsoKeeps: 'their risk scores',
        requires: USES_CUSTOM_ENUMS,
      },
      {
        key: 'identityHolders',
        label: 'Personnel',
        flag: 'withIdentityHolders',
        objectType: ObjectTypes.IDENTITY_HOLDER,
        schemas: ['identity_holder'],
        detailHeader: 'Status',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'contacts', label: 'Contacts', flag: 'withContacts', objectType: ObjectTypes.CONTACT, schemas: ['contact'], detailHeader: 'Email', isDetailFreeText: true },
    ],
  },
  {
    label: 'Exposure',
    previewDocument: GET_DEMO_DATA_EXPOSURE_PREVIEW,
    types: [
      { key: 'risks', label: 'Risks', flag: 'withRisks', objectType: ObjectTypes.RISK, schemas: ['risk'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'findings', label: 'Findings', flag: 'withFindings', objectType: ObjectTypes.FINDING, schemas: ['finding'], detailHeader: 'Severity', requires: USES_CUSTOM_ENUMS },
      {
        key: 'vulnerabilities',
        label: 'Vulnerabilities',
        flag: 'withVulnerabilities',
        objectType: ObjectTypes.VULNERABILITY,
        schemas: ['vulnerability'],
        detailHeader: 'Severity',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'remediations', label: 'Remediations', flag: 'withRemediations', objectType: ObjectTypes.REMEDIATION, schemas: ['remediation'], detailHeader: 'State', requires: USES_CUSTOM_ENUMS },
      { key: 'actionPlans', label: 'Action Plans', flag: 'withActionPlans', objectType: ObjectTypes.ACTION_PLAN, schemas: ['action_plan'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'reviews', label: 'Reviews', flag: 'withReviews', objectType: ObjectTypes.REVIEW, schemas: ['review'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
    ],
  },
  {
    label: 'Automation',
    previewDocument: GET_DEMO_DATA_AUTOMATION_PREVIEW,
    types: [
      { key: 'tasks', label: 'Tasks', flag: 'withTasks', objectType: ObjectTypes.TASK, schemas: ['task'], detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'assessments', label: 'Questionnaires', flag: 'withAssessments', objectType: ObjectTypes.ASSESSMENT, schemas: ['assessment'], detailHeader: 'Type', recommended: true },
      {
        key: 'campaigns',
        label: 'Campaigns',
        flag: 'withCampaigns',
        objectType: ObjectTypes.CAMPAIGN,
        schemas: ['campaign'],
        detailHeader: 'Status',
        requires: ['assessments', 'emailTemplates'],
      },
      {
        key: 'emailTemplates',
        label: 'Email Templates',
        flag: 'withEmailTemplates',
        objectType: ObjectTypes.EMAIL_TEMPLATE,
        schemas: ['email_template'],
        detailHeader: 'Description',
        isDetailFreeText: true,
        recommended: true,
      },
    ],
  },
  {
    label: 'Organization Settings',
    previewDocument: GET_DEMO_DATA_ORGANIZATION_SETTINGS_PREVIEW,
    types: [
      {
        key: 'customTypeEnums',
        label: 'Custom Enums',
        flag: 'withCustomTypeEnums',
        objectType: ObjectTypes.CUSTOM_TYPE_ENUM,
        schemas: ['custom_type_enum'],
        detailHeader: 'Applies To',
        recommended: true,
      },
      { key: 'groups', label: 'Groups', flag: 'withGroups', objectType: ObjectTypes.GROUP, schemas: ['group'], detailHeader: 'Description', isDetailFreeText: true },
    ],
  },
]

export const NOTHING_KEPT: ReadonlySet<TDemoDataTypeKey> = new Set()

export const DEMO_DATA_TYPES = DEMO_DATA_TYPE_GROUPS.flatMap((group) => group.types)

const LINK_SCHEMAS: { schema: string; between: TDemoDataTypeKey[] }[] = [{ schema: 'assessment_policy', between: ['assessments', 'internalPolicies'] }]

const DEMO_DATA_TYPE_BY_KEY = new Map(DEMO_DATA_TYPES.map((type) => [type.key, type]))

export const withRequiredTypes = (selected: ReadonlySet<TDemoDataTypeKey>): Set<TDemoDataTypeKey> => {
  const kept = new Set(selected)
  kept.forEach((key) => DEMO_DATA_TYPE_BY_KEY.get(key)?.requires?.forEach((required) => kept.add(required)))
  return kept
}

export const requiredByLabels = (key: TDemoDataTypeKey, kept: ReadonlySet<TDemoDataTypeKey>): string[] =>
  DEMO_DATA_TYPES.filter((type) => kept.has(type.key) && type.requires?.includes(key)).map((type) => type.label)

export const toKeptSchemas = (kept: ReadonlySet<TDemoDataTypeKey>): string[] => [
  ...DEMO_DATA_TYPES.filter((type) => kept.has(type.key)).flatMap((type) => type.schemas),
  ...LINK_SCHEMAS.filter((link) => link.between.every((key) => kept.has(key))).map((link) => link.schema),
]

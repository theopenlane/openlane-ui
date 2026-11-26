import { ObjectTypes } from '@repo/codegen/src/type-names'
import {
  GET_DEMO_DATA_AUTOMATION_PREVIEW,
  GET_DEMO_DATA_COMPLIANCE_PREVIEW,
  GET_DEMO_DATA_EXPOSURE_PREVIEW,
  GET_DEMO_DATA_ORGANIZATION_SETTINGS_PREVIEW,
  GET_DEMO_DATA_REGISTRY_PREVIEW,
} from '@repo/codegen/query/demo-data'
import { type GetDemoDataTypeCountsQuery } from '@repo/codegen/src/schema'
import { objectToSnakeCase } from '@/utils/strings'

export type TDemoDataTypeKey = Exclude<keyof GetDemoDataTypeCountsQuery, '__typename'>
export type TDemoDataTypeFlag = `with${Capitalize<TDemoDataTypeKey>}`

type TDemoDataTypeIdentity = { [Key in TDemoDataTypeKey]: { key: Key; flag: `with${Capitalize<Key>}` } }[TDemoDataTypeKey]

export type TDemoDataType = TDemoDataTypeIdentity & {
  label: string
  objectType: ObjectTypes
  linkedTypes?: ObjectTypes[]
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
      { key: 'programs', label: 'Programs', flag: 'withPrograms', objectType: ObjectTypes.PROGRAM, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      {
        key: 'controls',
        label: 'Controls',
        flag: 'withControls',
        objectType: ObjectTypes.CONTROL,
        linkedTypes: [ObjectTypes.MAPPED_CONTROL, ObjectTypes.CONTROL_OBJECTIVE, ObjectTypes.CONTROL_IMPLEMENTATION],
        detailHeader: 'Status',
        alsoKeeps: 'their objectives, implementations and mappings',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'evidences', label: 'Evidence', flag: 'withEvidences', objectType: ObjectTypes.EVIDENCE, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      {
        key: 'internalPolicies',
        label: 'Policies',
        flag: 'withInternalPolicies',
        objectType: ObjectTypes.INTERNAL_POLICY,
        detailHeader: 'Status',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'procedures', label: 'Procedures', flag: 'withProcedures', objectType: ObjectTypes.PROCEDURE, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
    ],
  },
  {
    label: 'Registry',
    previewDocument: GET_DEMO_DATA_REGISTRY_PREVIEW,
    types: [
      { key: 'platforms', label: 'Platforms', flag: 'withPlatforms', objectType: ObjectTypes.PLATFORM, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'systemDetails', label: 'System Details', flag: 'withSystemDetails', objectType: ObjectTypes.SYSTEM_DETAIL, detailHeader: 'Sensitivity' },
      { key: 'assets', label: 'Assets', flag: 'withAssets', objectType: ObjectTypes.ASSET, detailHeader: 'Type', requires: USES_CUSTOM_ENUMS },
      {
        key: 'entities',
        label: 'Vendors',
        flag: 'withEntities',
        objectType: ObjectTypes.ENTITY,
        linkedTypes: [ObjectTypes.VENDOR_RISK_SCORE],
        detailHeader: 'Status',
        alsoKeeps: 'their risk scores',
        requires: USES_CUSTOM_ENUMS,
      },
      {
        key: 'identityHolders',
        label: 'Personnel',
        flag: 'withIdentityHolders',
        objectType: ObjectTypes.IDENTITY_HOLDER,
        detailHeader: 'Status',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'contacts', label: 'Contacts', flag: 'withContacts', objectType: ObjectTypes.CONTACT, detailHeader: 'Email', isDetailFreeText: true },
    ],
  },
  {
    label: 'Exposure',
    previewDocument: GET_DEMO_DATA_EXPOSURE_PREVIEW,
    types: [
      { key: 'risks', label: 'Risks', flag: 'withRisks', objectType: ObjectTypes.RISK, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'findings', label: 'Findings', flag: 'withFindings', objectType: ObjectTypes.FINDING, detailHeader: 'Severity', requires: USES_CUSTOM_ENUMS },
      {
        key: 'vulnerabilities',
        label: 'Vulnerabilities',
        flag: 'withVulnerabilities',
        objectType: ObjectTypes.VULNERABILITY,
        detailHeader: 'Severity',
        requires: USES_CUSTOM_ENUMS,
      },
      { key: 'remediations', label: 'Remediations', flag: 'withRemediations', objectType: ObjectTypes.REMEDIATION, detailHeader: 'State', requires: USES_CUSTOM_ENUMS },
      { key: 'actionPlans', label: 'Action Plans', flag: 'withActionPlans', objectType: ObjectTypes.ACTION_PLAN, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'reviews', label: 'Reviews', flag: 'withReviews', objectType: ObjectTypes.REVIEW, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
    ],
  },
  {
    label: 'Automation',
    previewDocument: GET_DEMO_DATA_AUTOMATION_PREVIEW,
    types: [
      { key: 'tasks', label: 'Tasks', flag: 'withTasks', objectType: ObjectTypes.TASK, detailHeader: 'Status', requires: USES_CUSTOM_ENUMS },
      { key: 'assessments', label: 'Questionnaires', flag: 'withAssessments', objectType: ObjectTypes.ASSESSMENT, detailHeader: 'Type', recommended: true },
      {
        key: 'campaigns',
        label: 'Campaigns',
        flag: 'withCampaigns',
        objectType: ObjectTypes.CAMPAIGN,
        detailHeader: 'Status',
        requires: ['assessments', 'emailTemplates'],
      },
      {
        key: 'emailTemplates',
        label: 'Email Templates',
        flag: 'withEmailTemplates',
        objectType: ObjectTypes.EMAIL_TEMPLATE,
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
        detailHeader: 'Applies To',
        recommended: true,
      },
      { key: 'groups', label: 'Groups', flag: 'withGroups', objectType: ObjectTypes.GROUP, detailHeader: 'Description', isDetailFreeText: true },
    ],
  },
]

export const NOTHING_KEPT: ReadonlySet<TDemoDataTypeKey> = new Set()

export const DEMO_DATA_TYPES = DEMO_DATA_TYPE_GROUPS.flatMap((group) => group.types)

const LINK_TYPES: { objectType: ObjectTypes; between: TDemoDataTypeKey[] }[] = [{ objectType: ObjectTypes.ASSESSMENT_POLICY, between: ['assessments', 'internalPolicies'] }]

const DEMO_DATA_TYPE_BY_KEY = new Map(DEMO_DATA_TYPES.map((type) => [type.key, type]))

export const withRequiredTypes = (selected: ReadonlySet<TDemoDataTypeKey>): Set<TDemoDataTypeKey> => {
  const kept = new Set(selected)
  kept.forEach((key) => DEMO_DATA_TYPE_BY_KEY.get(key)?.requires?.forEach((required) => kept.add(required)))
  return kept
}

export const requiredByLabels = (key: TDemoDataTypeKey, kept: ReadonlySet<TDemoDataTypeKey>): string[] =>
  DEMO_DATA_TYPES.filter((type) => kept.has(type.key) && type.requires?.includes(key)).map((type) => type.label)

export const toKeptSchemas = (kept: ReadonlySet<TDemoDataTypeKey>): string[] =>
  [
    ...DEMO_DATA_TYPES.filter((type) => kept.has(type.key)).flatMap(({ objectType, linkedTypes = [] }) => [objectType, ...linkedTypes]),
    ...LINK_TYPES.filter((link) => link.between.every((key) => kept.has(key))).map((link) => link.objectType),
  ].map(objectToSnakeCase)

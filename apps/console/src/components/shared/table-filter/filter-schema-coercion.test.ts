import { buildClientSchema, getNamedType, isEnumType, isInputObjectType, validateInputValue, type IntrospectionQuery } from 'graphql'
import introspection from '@repo/codegen/src/introspectionschema.json'
import { getQuickFiltersWhereCondition, getWhereCondition, type TQuickFilter } from './table-filter-helper'
import { whereGenerator } from './where-generator'
import { type TFilterState } from './filter-storage'
import { type FilterField } from '@/types'

import { getFilterFields as getAssetFilterFields } from '@/components/pages/protected/assets/table/table-config'
import { getFilterFields as getContactFilterFields } from '@/components/pages/protected/contacts/table/table-config'
import { getFilterFields as getFindingFilterFields } from '@/components/pages/protected/findings/table/table-config'
import { getFilterFields as getPersonnelFilterFields } from '@/components/pages/protected/personnel/table/table-config'
import { getFilterFields as getPlatformFilterFields } from '@/components/pages/protected/platforms/table/table-config'
import { getFilterFields as getRemediationFilterFields } from '@/components/pages/protected/remediations/table/table-config'
import { getFilterFields as getReviewFilterFields } from '@/components/pages/protected/reviews/table/table-config'
import { getFilterFields as getScanFilterFields } from '@/components/pages/protected/scans/table/table-config'
import { getFilterFields as getSystemDetailFilterFields } from '@/components/pages/protected/system-details/table/table-config'
import { getFilterFields as getVendorFilterFields } from '@/components/pages/protected/vendors/table/table-config'
import { getFilterFields as getVulnerabilityFilterFields } from '@/components/pages/protected/vulnerabilities/table/table-config'
import { getFilterFields as getActionPlanFilterFields } from '@/components/pages/protected/action-plans/table/table-config'
import { getFilterFields as getWorkflowFilterFields } from '@/components/pages/protected/workflows/table/table-config'
import { getCampaignFilterFields } from '@/components/pages/protected/campaigns/table/table-config'
import { getControlsFilterFields, mapControlsFilterKey } from '@/components/pages/protected/controls/table/table-config'
import { getSubcontrolsFilterFields } from '@/components/pages/protected/controls/tabs/linked-controls/subcontrols-table-config'
import { getEvidenceFilterFields } from '@/components/pages/protected/controls/tabs/evidence/evidence-table-config'
import { getEvidenceFilterableFields, mapEvidenceFilterKey } from '@/components/pages/protected/evidence/table/table-config'
import { getGroupsFilterFields, mapGroupsFilterKey } from '@/components/pages/protected/groups/table/table-config'
import { getPoliciesFilterFields, mapPoliciesFilterKey } from '@/components/pages/protected/policies/table/table-config'
import { getProceduresFilterFields, mapProceduresFilterKey } from '@/components/pages/protected/procedures/table/table-config'
import { getQuestionnaireFilterFields, mapQuestionnaireFilterKey } from '@/components/pages/protected/questionnaire/table/table-config'
import { getTemplateFilterFields } from '@/components/pages/protected/questionnaire/template/table/table-config'
import { getRisksFilterFields } from '@/components/pages/protected/risks/table/table-config'
import { getTasksFilterFields, getTaskQuickFilters } from '@/components/pages/protected/tasks/table/table-config'
import { getTasksFilterFields as getStandardsFilterFields } from '@/components/pages/protected/standards/table/table-config'
import { getSubprocessorsFilterFields } from '@/components/pages/protected/trust-center/subprocessors/table/table-config'
import { ndaRequestsFilterFields } from '@/components/pages/protected/trust-center/NDAs/table/table-config'
import { trustCenterDocsFilterFields, mapTrustCenterDocFilterKey } from '@/components/pages/protected/trust-center/reports-and-certifications/table/table-config'
import { getAuditorDashboardFilterFields, createAuditorControlsFilterMapper, getAuditorDashboardQuickFilters } from '@/components/pages/protected/auditor-dashboard/table/table-config'
import { getActivityTaskFilterFields } from '@/components/shared/crud-base/tabs/activity-tasks-config'
import { SUBSCRIBERS_FILTER_FIELDS } from '@/components/pages/protected/organization-settings/subscribers/table/table-config'
import { MEMBERS_FILTER_FIELDS, mapMembersFilterKey, INVITES_FILTER_FIELDS } from '@/components/pages/protected/user-management/members/table/table-config'
import { REVIEW_FILTER_FIELDS } from '@/components/pages/protected/reviews/common/risk-review-config'
import { TOKEN_FILTER_FIELDS } from '@/components/pages/protected/developers/table/table-config'
import { deliveryFilterFields, mapDeliveryFilterKey } from '@/components/pages/protected/questionnaire/delivery-filter-config'
import {
  DOCUMENTATION_POLICIES_IGNORED_FILTER_KEYS,
  mapDocumentationPoliciesFilterKey,
  mapDocumentationProceduresFilterKey,
} from '@/components/pages/protected/controls/tabs/documentation/documentation-filter-mappers'

const schema = buildClientSchema(introspection satisfies { __schema: unknown } as IntrospectionQuery)

const emptyEnumOptions = <T extends object>(): T => new Proxy({} as T, { get: () => [] })

const noOptions: { value: string; label: string }[] = []

const enumValueFor = (whereInputName: string, key: string): string | undefined => {
  const whereInput = schema.getType(whereInputName)
  if (!isInputObjectType(whereInput)) return undefined

  const inputField = whereInput.getFields()[key]
  if (!inputField) return undefined

  const named = getNamedType(inputField.type)
  return isEnumType(named) ? named.getValues()[0]?.name : undefined
}

const sampleValue = (field: FilterField, whereInputName: string): TFilterState[string] => {
  const scalar = enumValueFor(whereInputName, field.key) ?? field.options?.[0]?.value ?? 'sample'

  switch (field.type) {
    case 'text':
    case 'select':
    case 'dropdownSearchSingleSelect':
    case 'dropdownUserSearch':
      return scalar
    case 'multiselect':
    case 'dropdownSearchMultiselect':
      return [scalar]
    case 'boolean':
    case 'radio':
      return true
    case 'sliderNumber':
      return 1
    case 'sliderRange':
      return { min: 1, max: 2 }
    case 'date':
      return new Date('2026-08-29T00:00:00.000Z')
    case 'dateRange':
      return { from: new Date('2026-08-29T00:00:00.000Z'), to: new Date('2026-08-31T00:00:00.000Z') }
  }
}

const coerceErrors = (whereInputName: string, value: unknown): string[] => {
  const inputType = schema.getType(whereInputName)
  if (!isInputObjectType(inputType)) return [`missing input type ${whereInputName}`]

  const errors: string[] = []
  validateInputValue(value, inputType, (error, path) => {
    errors.push(`${path.join('.') || '<root>'}: ${error.message}`)
  })
  return errors
}

type FilterKeyMapper = (key: string, value: unknown) => object

type Suite = {
  page: string
  whereInput: string
  fields: FilterField[]
  mapper?: FilterKeyMapper
  inertKeys?: readonly string[]
}

const passThrough: FilterKeyMapper = (key, value) => ({ [key]: value })

const suites: Suite[] = [
  { page: 'action-plans', whereInput: 'ActionPlanWhereInput', fields: getActionPlanFilterFields() },
  { page: 'assets', whereInput: 'AssetWhereInput', fields: getAssetFilterFields(emptyEnumOptions()) },
  { page: 'auditor-dashboard', whereInput: 'ControlWhereInput', fields: getAuditorDashboardFilterFields(noOptions, noOptions), mapper: createAuditorControlsFilterMapper('program_1') },
  { page: 'campaigns', whereInput: 'CampaignWhereInput', fields: getCampaignFilterFields() },
  { page: 'contacts', whereInput: 'ContactWhereInput', fields: getContactFilterFields(emptyEnumOptions()) },
  { page: 'controls', whereInput: 'ControlWhereInput', fields: getControlsFilterFields(noOptions, noOptions, noOptions, noOptions, noOptions, true), mapper: mapControlsFilterKey },
  { page: 'controls/evidence', whereInput: 'EvidenceWhereInput', fields: getEvidenceFilterFields() },
  { page: 'controls/subcontrols', whereInput: 'SubcontrolWhereInput', fields: getSubcontrolsFilterFields([], []) },
  { page: 'crud-base/activity-tasks', whereInput: 'TaskWhereInput', fields: getActivityTaskFilterFields() },
  { page: 'developers/api-tokens', whereInput: 'APITokenWhereInput', fields: TOKEN_FILTER_FIELDS },
  { page: 'developers/personal-access-tokens', whereInput: 'PersonalAccessTokenWhereInput', fields: TOKEN_FILTER_FIELDS },
  { page: 'evidence', whereInput: 'EvidenceWhereInput', fields: getEvidenceFilterableFields(noOptions, noOptions), mapper: mapEvidenceFilterKey },
  { page: 'findings', whereInput: 'FindingWhereInput', fields: getFindingFilterFields(emptyEnumOptions()) },
  { page: 'groups', whereInput: 'GroupWhereInput', fields: getGroupsFilterFields(noOptions), mapper: mapGroupsFilterKey },
  { page: 'organization-settings/subscribers', whereInput: 'SubscriberWhereInput', fields: SUBSCRIBERS_FILTER_FIELDS },
  { page: 'personnel', whereInput: 'IdentityHolderWhereInput', fields: getPersonnelFilterFields(emptyEnumOptions()) },
  { page: 'platforms', whereInput: 'PlatformWhereInput', fields: getPlatformFilterFields(emptyEnumOptions()) },
  { page: 'policies', whereInput: 'InternalPolicyWhereInput', fields: getPoliciesFilterFields(noOptions, noOptions, noOptions, noOptions, true), mapper: mapPoliciesFilterKey },
  { page: 'procedures', whereInput: 'ProcedureWhereInput', fields: getProceduresFilterFields(noOptions, noOptions, noOptions, noOptions, true), mapper: mapProceduresFilterKey },
  { page: 'questionnaire', whereInput: 'AssessmentWhereInput', fields: getQuestionnaireFilterFields(noOptions, noOptions), mapper: mapQuestionnaireFilterKey },
  { page: 'questionnaire/template', whereInput: 'TemplateWhereInput', fields: getTemplateFilterFields(noOptions, noOptions) },
  { page: 'remediations', whereInput: 'RemediationWhereInput', fields: getRemediationFilterFields(emptyEnumOptions()) },
  { page: 'reviews', whereInput: 'ReviewWhereInput', fields: getReviewFilterFields(emptyEnumOptions()) },
  { page: 'reviews/risk-review', whereInput: 'ReviewWhereInput', fields: REVIEW_FILTER_FIELDS },
  { page: 'risks', whereInput: 'RiskWhereInput', fields: getRisksFilterFields(noOptions, noOptions, noOptions, noOptions, true) },
  { page: 'scans', whereInput: 'ScanWhereInput', fields: getScanFilterFields(emptyEnumOptions()) },
  { page: 'standards', whereInput: 'StandardWhereInput', fields: getStandardsFilterFields() },
  { page: 'system-details', whereInput: 'SystemDetailWhereInput', fields: getSystemDetailFilterFields(emptyEnumOptions(), true) },
  { page: 'tasks', whereInput: 'TaskWhereInput', fields: getTasksFilterFields([], noOptions, noOptions, true) },
  { page: 'trust-center/ndas', whereInput: 'TrustCenterNdaRequestWhereInput', fields: ndaRequestsFilterFields },
  { page: 'trust-center/reports', whereInput: 'TrustCenterDocWhereInput', fields: trustCenterDocsFilterFields, mapper: mapTrustCenterDocFilterKey },
  { page: 'trust-center/subprocessors', whereInput: 'TrustCenterSubprocessorWhereInput', fields: getSubprocessorsFilterFields(noOptions) },
  { page: 'user-management/invites', whereInput: 'InviteWhereInput', fields: INVITES_FILTER_FIELDS },
  { page: 'user-management/members', whereInput: 'OrgMembershipWhereInput', fields: MEMBERS_FILTER_FIELDS, mapper: mapMembersFilterKey },
  { page: 'vendors', whereInput: 'EntityWhereInput', fields: getVendorFilterFields(emptyEnumOptions()) },
  { page: 'vulnerabilities', whereInput: 'VulnerabilityWhereInput', fields: getVulnerabilityFilterFields(emptyEnumOptions()) },
  { page: 'workflows', whereInput: 'WorkflowDefinitionWhereInput', fields: getWorkflowFilterFields() },
  {
    page: 'controls/documentation/policies',
    whereInput: 'InternalPolicyWhereInput',
    fields: getPoliciesFilterFields(noOptions, noOptions, noOptions, noOptions, true),
    mapper: mapDocumentationPoliciesFilterKey,
    inertKeys: DOCUMENTATION_POLICIES_IGNORED_FILTER_KEYS,
  },
  {
    page: 'controls/documentation/procedures',
    whereInput: 'ProcedureWhereInput',
    fields: getProceduresFilterFields(noOptions, noOptions, noOptions, noOptions, true),
    mapper: mapDocumentationProceduresFilterKey,
  },
  { page: 'questionnaire/delivery', whereInput: 'AssessmentResponseWhereInput', fields: deliveryFilterFields, mapper: mapDeliveryFilterKey },
]

const snapshotIsMissing = (whereInput: string): boolean => !schema.getType(whereInput)

const buildWhere = (field: FilterField, value: TFilterState[string], mapper: FilterKeyMapper): object => whereGenerator(getWhereCondition({ [field.key]: value }, [field]) as object, mapper)

describe('filter fields coerce against the GraphQL schema', () => {
  for (const { page, whereInput, fields, mapper } of suites) {
    const mapKey = mapper ?? passThrough

    if (snapshotIsMissing(whereInput)) {
      test(`${page} is skipped because ${whereInput} is absent from the introspection snapshot`, () => {
        console.warn(`${whereInput} is missing from packages/codegen/src/introspectionschema.json - re-run codegen to cover ${page}`)
        expect(fields.length).toBeGreaterThan(0)
      })
      continue
    }

    test(`${page} declares at least one filter field`, () => {
      expect(fields.length).toBeGreaterThan(0)
    })

    for (const field of fields) {
      test(`${page} \u00b7 ${field.key} (${field.type})`, () => {
        expect(coerceErrors(whereInput, buildWhere(field, sampleValue(field, whereInput), mapKey))).toEqual([])
      })
    }

    for (const field of fields) {
      if (!field.nullableKey) continue

      test(`${page} \u00b7 ${field.key} not-set state`, () => {
        expect(coerceErrors(whereInput, buildWhere(field, { nullState: 'IsNil' }, mapKey))).toEqual([])
      })
    }
  }
})

const producesNoPredicate = (where: object): boolean => {
  const entries = (where as { and?: object[] }).and
  if (entries) return entries.length > 0 && entries.every((entry) => Object.keys(entry).length === 0)
  return Object.keys(where).length === 0
}

describe('a filter that is offered actually reaches the query', () => {
  for (const { page, whereInput, fields, mapper, inertKeys } of suites) {
    if (snapshotIsMissing(whereInput)) continue

    const mapKey = mapper ?? passThrough
    const declaredInert = new Set(inertKeys ?? [])

    test(`${page} swallows only the keys it declares inert`, () => {
      const swallowed = fields.filter((field) => producesNoPredicate(buildWhere(field, sampleValue(field, whereInput), mapKey))).map((field) => field.key)

      expect(swallowed.sort()).toEqual([...declaredInert].sort())
    })
  }
})

const quickFilterSuites: { page: string; whereInput: string; quickFilters: TQuickFilter[]; mapper?: FilterKeyMapper }[] = [
  { page: 'tasks', whereInput: 'TaskWhereInput', quickFilters: getTaskQuickFilters('user_1', false) },
  {
    page: 'auditor-dashboard',
    whereInput: 'ControlWhereInput',
    quickFilters: getAuditorDashboardQuickFilters('program_1'),
    mapper: createAuditorControlsFilterMapper('program_1'),
  },
]

describe('quick filter conditions coerce against the GraphQL schema', () => {
  for (const { page, whereInput, quickFilters, mapper } of quickFilterSuites) {
    const mapKey = mapper ?? passThrough

    test(`${page} declares at least one quick filter`, () => {
      expect(quickFilters.length).toBeGreaterThan(0)
    })

    for (const quickFilter of quickFilters) {
      test(`${page} \u00b7 ${quickFilter.key}`, () => {
        expect(coerceErrors(whereInput, whereGenerator(getQuickFiltersWhereCondition(quickFilter) as object, mapKey))).toEqual([])
      })
    }
  }
})

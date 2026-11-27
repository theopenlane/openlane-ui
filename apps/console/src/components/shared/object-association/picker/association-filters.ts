import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  ActionPlanDocumentStatus,
  ActionPlanPriority,
  AssetAssetType,
  CampaignCampaignStatus,
  CampaignCampaignType,
  ControlImplementationDocumentStatus,
  ControlObjectiveObjectiveStatus,
  EntityEntityStatus,
  EntityVendorTier,
  IdentityHolderIdentityHolderType,
  IdentityHolderUserStatus,
  InternalPolicyDocumentStatus,
  ProcedureDocumentStatus,
  ProgramProgramStatus,
  RemediationRemediationStatus,
  ReviewReviewStatus,
  RiskRiskImpact,
  RiskRiskLikelihood,
  RiskRiskStatus,
  ScanScanStatus,
  ScanScanType,
  TaskTaskStatus,
  type ControlWhereInput,
  type GroupWhereInput,
} from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { buildCustomStandardFilterWhere, CUSTOM_STANDARD_FILTER_OPTION } from '@/components/shared/table-filter/custom-standard-filter'
import { organizationStandardsWhere } from '@/constants/standards'
import { useControlSelect, useGetControlCategories } from '@/lib/graphql-hooks/control'
import { GLOBAL_ENUM_FIELD, useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGroupSelect } from '@/lib/graphql-hooks/group'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { useStandardsSelect } from '@/lib/graphql-hooks/standard'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { isImpersonation } from '@/lib/authz/utils'
import { generateWhere, ObjectTypeObjects, type TObjectWhereInput } from '@/components/shared/object-association/object-association-config'

const ME_OPTION_LABEL = 'Me'
const MY_GROUPS_VALUE = 'my-groups'

export type TFilterOption = { value: string; label: string }

type TFilterOptionsResult = {
  options: TFilterOption[]
  meOption?: TFilterOption
  isFetching: boolean
  isError?: boolean
  isServerSearch: boolean
}

type TFilterContext = { userId: string | undefined }

export type TAssociationFilter<TWhere extends object = object> = {
  key: string
  label: string
  requires?: ObjectTypes
  useOptions: (term: string) => TFilterOptionsResult
  toWhere: (values: string[], context: TFilterContext) => TWhere
}

const useCurrentUserId = () => {
  const { data: session } = useSession()
  return isImpersonation(session) ? undefined : session?.user?.userId
}

const pickEnumValues = <T extends string>(values: Record<string, T>, selected: string[]): T[] => Object.values(values).filter((value) => selected.includes(value))

const enumFilter = <TEnum extends string, TWhere extends object>(key: string, label: string, values: Record<string, TEnum>, buildWhere: (selected: TEnum[]) => TWhere): TAssociationFilter<TWhere> => {
  const result: TFilterOptionsResult = { options: enumToOptions(values), isFetching: false, isServerSearch: false }
  return { key, label, useOptions: () => result, toWhere: (selected) => buildWhere(pickEnumValues(values, selected)) }
}

const customEnumFilter = <TWhere extends object>(
  key: string,
  label: string,
  where: { objectType?: string; field: string },
  buildWhere: (selected: string[]) => TWhere,
): TAssociationFilter<TWhere> => ({
  key,
  label,
  useOptions: () => {
    const { enumOptions, isLoading, isError } = useGetCustomTypeEnums({ where })
    return { options: enumOptions, isFetching: isLoading, isError, isServerSearch: false }
  },
  toWhere: buildWhere,
})

const userFilter = <TWhere extends object>(key: string, label: string, buildWhere: (selected: string[]) => TWhere): TAssociationFilter<TWhere> => ({
  key,
  label,
  useOptions: (term) => {
    const userId = useCurrentUserId()
    const { userOptions, isFetching, isError } = useUserSelect({ where: term ? { hasUserWith: [{ displayNameContainsFold: term }] } : undefined })
    return {
      options: userOptions.filter((option) => option.value !== userId),
      meOption: userId ? { value: userId, label: ME_OPTION_LABEL } : undefined,
      isFetching,
      isError,
      isServerSearch: true,
    }
  },
  toWhere: buildWhere,
})

const groupFilter = <TWhere extends object>(key: string, label: string, buildWhere: (group: GroupWhereInput) => TWhere): TAssociationFilter<TWhere> => ({
  key,
  label,
  useOptions: (term) => {
    const userId = useCurrentUserId()
    const { groupOptions, isFetching, isError } = useGroupSelect({ where: term ? { or: [{ displayNameContainsFold: term }, { nameContainsFold: term }] } : undefined })
    return {
      options: groupOptions,
      meOption: userId ? { value: MY_GROUPS_VALUE, label: ME_OPTION_LABEL } : undefined,
      isFetching,
      isError,
      isServerSearch: true,
    }
  },
  toWhere: (values, { userId }) => {
    const groupIds = values.filter((value) => value !== MY_GROUPS_VALUE)
    const alternatives: GroupWhereInput[] = []
    if (groupIds.length > 0) alternatives.push({ idIn: groupIds })
    if (values.includes(MY_GROUPS_VALUE) && userId) alternatives.push({ hasMembersWith: [{ userID: userId }] })
    return buildWhere({ or: alternatives })
  },
})

const controlFilter = <TWhere extends object>(key: string, label: string, buildWhere: (controlIds: string[]) => TWhere): TAssociationFilter<TWhere> => ({
  key,
  label,
  requires: ObjectTypes.CONTROL,
  useOptions: (term) => {
    const { data: session } = useSession()
    const { controlOptions, isFetching, error } = useControlSelect({ where: generateWhere(ObjectTypeObjects.CONTROL, term, session?.user.activeOrganizationId) })
    return { options: controlOptions, isFetching, isError: !!error, isServerSearch: true }
  },
  toWhere: buildWhere,
})

const buildFrameworkWhere = (values: string[]): ControlWhereInput => (values.includes(CUSTOM_STANDARD_FILTER_OPTION.value) ? buildCustomStandardFilterWhere(values) : { standardIDIn: values })

const useFrameworkOptions = (): TFilterOptionsResult => {
  const { data: session } = useSession()
  const { standardOptions, isFetching, isError } = useStandardsSelect({ where: organizationStandardsWhere(session?.user.activeOrganizationId) })
  return { options: [CUSTOM_STANDARD_FILTER_OPTION, ...standardOptions], isFetching, isError, isServerSearch: false }
}

const useCategoryOptions = (): TFilterOptionsResult => {
  const { data, isFetching, isError } = useGetControlCategories({})
  const options = useMemo(() => (data?.controlCategories ?? []).map((category) => ({ value: category, label: category })), [data])
  return { options, isFetching, isError, isServerSearch: false }
}

const useTagOptions = (): TFilterOptionsResult => {
  const { tagOptions, isFetching, isError } = useGetTags()
  return { options: tagOptions, isFetching, isError, isServerSearch: false }
}

const ENVIRONMENT_FILTER = customEnumFilter('environment', 'Environment', { field: GLOBAL_ENUM_FIELD.environment }, (environmentNameIn) => ({ environmentNameIn }))
const SCOPE_FILTER = customEnumFilter('scope', 'Scope', { field: GLOBAL_ENUM_FIELD.scope }, (scopeNameIn) => ({ scopeNameIn }))
const CONTROL_LINKED_FILTER = controlFilter('control', 'Control linked', (controlIds) => ({ hasControlsWith: [{ idIn: controlIds }] }))

type TAssociationFilterMap = { [K in ObjectTypeObjects]: readonly TAssociationFilter<TObjectWhereInput[K]>[] }

const ASSOCIATION_FILTERS: TAssociationFilterMap = {
  [ObjectTypeObjects.CONTROL]: [
    { key: 'framework', label: 'Framework', useOptions: useFrameworkOptions, toWhere: buildFrameworkWhere },
    { key: 'category', label: 'Category', useOptions: useCategoryOptions, toWhere: (values) => ({ categoryIn: values }) },
    groupFilter('owner', 'Owner', (group) => ({ hasControlOwnerWith: [group] })),
  ],
  [ObjectTypeObjects.SUB_CONTROL]: [
    { key: 'framework', label: 'Framework', useOptions: useFrameworkOptions, toWhere: (values) => ({ hasControlWith: [buildFrameworkWhere(values)] }) },
    controlFilter('parentControl', 'Parent control', (controlIds) => ({ controlIDIn: controlIds })),
    groupFilter('owner', 'Owner', (group) => ({ hasControlOwnerWith: [group] })),
  ],
  [ObjectTypeObjects.EVIDENCE]: [
    CONTROL_LINKED_FILTER,
    { key: 'tags', label: 'Tags', useOptions: useTagOptions, toWhere: (values) => ({ or: values.map((tag) => ({ tagsHas: tag })) }) },
    userFilter('createdBy', 'Created by', (userIds) => ({ createdByIn: userIds })),
  ],
  [ObjectTypeObjects.ASSET]: [enumFilter('type', 'Type', AssetAssetType, (assetTypeIn) => ({ assetTypeIn })), ENVIRONMENT_FILTER, SCOPE_FILTER],
  [ObjectTypeObjects.ACTION_PLAN]: [
    enumFilter('status', 'Status', ActionPlanDocumentStatus, (statusIn) => ({ statusIn })),
    enumFilter('priority', 'Priority', ActionPlanPriority, (priorityIn) => ({ priorityIn })),
  ],
  [ObjectTypeObjects.CONTROL_IMPLEMENTATION]: [enumFilter('status', 'Status', ControlImplementationDocumentStatus, (statusIn) => ({ statusIn })), CONTROL_LINKED_FILTER],
  [ObjectTypeObjects.CONTROL_OBJECTIVE]: [enumFilter('status', 'Status', ControlObjectiveObjectiveStatus, (statusIn) => ({ statusIn })), CONTROL_LINKED_FILTER],
  [ObjectTypeObjects.PROGRAM]: [enumFilter('status', 'Status', ProgramProgramStatus, (statusIn) => ({ statusIn }))],
  [ObjectTypeObjects.TASK]: [enumFilter('status', 'Status', TaskTaskStatus, (statusIn) => ({ statusIn })), userFilter('assignee', 'Assignee', (userIds) => ({ assigneeIDIn: userIds }))],
  [ObjectTypeObjects.GROUP]: [],
  [ObjectTypeObjects.INTERNAL_POLICY]: [
    enumFilter('status', 'Status', InternalPolicyDocumentStatus, (statusIn) => ({ statusIn })),
    customEnumFilter('type', 'Type', { objectType: 'internal_policy', field: 'kind' }, (internalPolicyKindNameIn) => ({ internalPolicyKindNameIn })),
    groupFilter('approver', 'Approver', (group) => ({ hasApproverWith: [group] })),
  ],
  [ObjectTypeObjects.PROCEDURE]: [
    enumFilter('status', 'Status', ProcedureDocumentStatus, (statusIn) => ({ statusIn })),
    customEnumFilter('type', 'Type', { objectType: 'procedure', field: 'kind' }, (procedureKindNameIn) => ({ procedureKindNameIn })),
    groupFilter('approver', 'Approver', (group) => ({ hasApproverWith: [group] })),
  ],
  [ObjectTypeObjects.RISK]: [
    enumFilter('status', 'Status', RiskRiskStatus, (statusIn) => ({ statusIn })),
    enumFilter('impact', 'Impact', RiskRiskImpact, (impactIn) => ({ impactIn })),
    enumFilter('likelihood', 'Likelihood', RiskRiskLikelihood, (likelihoodIn) => ({ likelihoodIn })),
  ],
  [ObjectTypeObjects.SCAN]: [enumFilter('type', 'Type', ScanScanType, (scanTypeIn) => ({ scanTypeIn })), enumFilter('status', 'Status', ScanScanStatus, (statusIn) => ({ statusIn }))],
  [ObjectTypeObjects.CAMPAIGN]: [
    enumFilter('type', 'Type', CampaignCampaignType, (campaignTypeIn) => ({ campaignTypeIn })),
    enumFilter('status', 'Status', CampaignCampaignStatus, (statusIn) => ({ statusIn })),
  ],
  [ObjectTypeObjects.ENTITY]: [enumFilter('status', 'Status', EntityEntityStatus, (statusIn) => ({ statusIn })), enumFilter('tier', 'Tier', EntityVendorTier, (tierIn) => ({ tierIn }))],
  [ObjectTypeObjects.FINDING]: [ENVIRONMENT_FILTER, SCOPE_FILTER],
  [ObjectTypeObjects.IDENTITY_HOLDER]: [
    enumFilter('type', 'Type', IdentityHolderIdentityHolderType, (identityHolderTypeIn) => ({ identityHolderTypeIn })),
    enumFilter('status', 'Status', IdentityHolderUserStatus, (statusIn) => ({ statusIn })),
  ],
  [ObjectTypeObjects.REMEDIATION]: [enumFilter('status', 'Status', RemediationRemediationStatus, (statusIn) => ({ statusIn }))],
  [ObjectTypeObjects.REVIEW]: [enumFilter('status', 'Status', ReviewReviewStatus, (statusIn) => ({ statusIn }))],
  [ObjectTypeObjects.VULNERABILITY]: [ENVIRONMENT_FILTER, SCOPE_FILTER],
}

export const getAssociationFilters = (objectType: ObjectTypeObjects): readonly TAssociationFilter[] => ASSOCIATION_FILTERS[objectType]

export type TAssociationFilterValues = Record<string, TFilterOption[]>

export const useAssociationFilterWheres = (filters: readonly TAssociationFilter[], values: TAssociationFilterValues): object[] => {
  const userId = useCurrentUserId()
  return filters.flatMap((filter) => {
    const selected = (values[filter.key] ?? []).map(({ value }) => value)
    return selected.length > 0 ? [filter.toWhere(selected, { userId })] : []
  })
}

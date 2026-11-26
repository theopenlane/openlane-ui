import { z } from 'zod'
import { defineFilterFields } from '@/types'
import { ControlImplementationDocumentStatus, ControlImplementationOrderField, type ControlImplementationWhereInput, type ControlWhereInput } from '@repo/codegen/src/schema'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { enumValuesToOptions } from '@/components/shared/enum-mapper/common-enum'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { buildCustomStandardFilterWhere, CUSTOM_STANDARD_FILTER_OPTION, CUSTOM_STANDARD_FILTER_VALUE } from '@/components/shared/table-filter/custom-standard-filter'
import { identityFilterKey } from '@/components/shared/table-filter/where-generator'
import { CONTROL_IMPLEMENTATIONS_HREF, getVerifiedLabel } from '@/utils/control-implementation'

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Compliance', href: '/programs' },
  { label: 'Implementations', href: CONTROL_IMPLEMENTATIONS_HREF },
]

export const statusOptions = enumValuesToOptions(Object.values(ControlImplementationDocumentStatus))

const LINKED_CONTROL_FRAMEWORK_KEY = 'linkedControlFramework'
const LINKED_CONTROL_REF_CODE_KEY = 'linkedControlRefCode'

type TSyntheticFilterKey = typeof LINKED_CONTROL_FRAMEWORK_KEY | typeof LINKED_CONTROL_REF_CODE_KEY

export const getFilterFields = (standardOptions: { value: string; label: string }[]) =>
  defineFilterFields<ControlImplementationWhereInput, TSyntheticFilterKey>()([
    {
      key: 'statusIn',
      label: 'Status',
      type: 'multiselect',
      options: statusOptions,
      icon: FilterIcons.Status,
    },
    {
      key: 'verified',
      label: 'Verified',
      type: 'radio',
      icon: FilterIcons.SecurityFeatureEnforced,
      radioOptions: [
        { value: true, label: getVerifiedLabel(true) },
        { value: false, label: getVerifiedLabel(false) },
      ],
    },
    {
      key: LINKED_CONTROL_FRAMEWORK_KEY,
      label: 'Linked Control Framework',
      type: 'multiselect',
      options: [...standardOptions, CUSTOM_STANDARD_FILTER_OPTION],
      icon: FilterIcons.Standard,
    },
    {
      key: LINKED_CONTROL_REF_CODE_KEY,
      label: 'Linked Control Ref Code',
      type: 'text',
      icon: FilterIcons.RefCode,
    },
  ])

export const bulkEditFieldSchema = z.object({
  status: z.enum(ControlImplementationDocumentStatus).optional(),
  verified: z.boolean().optional(),
  implementationDate: z.date().optional(),
})

export const CONTROL_IMPLEMENTATION_SORT_FIELDS = enumToSortFields(ControlImplementationOrderField)

export const visibilityFields = {
  implementationDate: false,
  verificationDate: false,
  tags: false,
  createdAt: false,
  createdBy: false,
  updatedBy: false,
}

type TLinkedControlFilters = ControlImplementationWhereInput & {
  [LINKED_CONTROL_FRAMEWORK_KEY]?: string[]
  [LINKED_CONTROL_REF_CODE_KEY]?: string
}

const buildFrameworkWhere = (values: string[]): ControlWhereInput => (values.includes(CUSTOM_STANDARD_FILTER_VALUE) ? buildCustomStandardFilterWhere(values) : { standardIDIn: values })

const buildLinkedControlWhere = (frameworks: string[], refCode: string): ControlImplementationWhereInput => {
  const frameworkWhere = frameworks.length > 0 ? buildFrameworkWhere(frameworks) : undefined
  const refCodeWhere = refCode ? { refCodeContainsFold: refCode } : {}

  return {
    or: [{ hasControlsWith: [{ ...frameworkWhere, ...refCodeWhere }] }, { hasSubcontrolsWith: [{ ...(frameworkWhere && { hasControlWith: [frameworkWhere] }), ...refCodeWhere }] }],
  }
}

export const transformFilters = (filters: ControlImplementationWhereInput): ControlImplementationWhereInput => {
  const conditions: TLinkedControlFilters[] = filters.and ?? []
  const frameworks = conditions.flatMap((condition) => condition[LINKED_CONTROL_FRAMEWORK_KEY] ?? [])
  const refCode = conditions.map((condition) => condition[LINKED_CONTROL_REF_CODE_KEY]?.trim()).find(Boolean) ?? ''
  if (frameworks.length === 0 && !refCode) return filters

  const otherConditions = conditions.filter((condition) => !(LINKED_CONTROL_FRAMEWORK_KEY in condition) && !(LINKED_CONTROL_REF_CODE_KEY in condition))
  return { ...filters, and: [...otherConditions, buildLinkedControlWhere(frameworks, refCode)] }
}

export const mapFilterKey = (key: string, value: unknown): ControlImplementationWhereInput =>
  key === 'verified' && value === false ? { or: [{ verified: false }, { verifiedIsNil: true }] } : identityFilterKey<ControlImplementationWhereInput>(key, value)

export const buildSearchWhere = (term: string): ControlImplementationWhereInput[] => {
  const matches = [{ refCodeContainsFold: term }, { referenceFrameworkContainsFold: term }]
  return matches.flatMap((match) => [{ hasControlsWith: [match] }, { hasSubcontrolsWith: [match] }])
}

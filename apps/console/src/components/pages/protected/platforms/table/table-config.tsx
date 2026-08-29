import { defineFilterFields } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { PlatformOrderField, type PlatformWhereInput } from '@repo/codegen/src/schema'
import { type EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { getEnvironmentFilterField, getScopeFilterField } from '@/components/shared/table-filter/scope-environment-filter-fields'

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/platforms' },
  { label: 'Platforms', href: '/registry/platforms' },
]

export const getFilterFields = (enumOptions: EnumOptions) =>
  defineFilterFields<PlatformWhereInput>()([
    {
      key: 'statusIn',
      label: 'Status',
      type: 'multiselect',
      icon: FilterIcons.Status,
      options: enumOptions.statusOptions,
    },
    getScopeFilterField(enumOptions.scopeOptions),
    getEnvironmentFilterField(enumOptions.environmentOptions),
    {
      key: 'containsPii',
      label: 'Contains PII',
      type: 'radio',
      icon: FilterIcons.Security,
      radioOptions: [
        { value: true, label: 'Contains PII' },
        { value: false, label: 'No PII' },
      ],
    },
  ])

export const PLATFORMS_SORT_FIELDS = enumToSortFields(PlatformOrderField)

export const visibilityFields = {
  id: false,
  name: true,
  status: true,
  businessPurpose: true,
  environmentName: true,
  scopeName: true,
  containsPii: true,
  businessOwner: false,
  technicalOwner: false,
  createdAt: false,
  updatedAt: true,
}

import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { PlatformOrderField } from '@repo/codegen/src/schema'
import { type EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Registry', href: '/registry/platforms' },
  { label: 'Platforms', href: '/registry/platforms' },
]

export const getFilterFields = (enumOptions: EnumOptions): FilterField[] => [
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: enumOptions.statusOptions,
  },
  {
    key: 'scopeNameIn',
    label: 'Scope',
    type: 'multiselect',
    icon: FilterIcons.Scope,
    options: enumOptions.scopeOptions,
  },
  {
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options: enumOptions.environmentOptions,
  },
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
]

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

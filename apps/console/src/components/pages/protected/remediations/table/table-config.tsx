import { defineFilterFields } from '@/types'
import { RemediationOrderField, type RemediationWhereInput } from '@repo/codegen/src/schema'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type EnumOptions } from './types'
import { enumToSortFields } from '@/components/shared/crud-base/utils'
import { getEnvironmentFilterField, getScopeFilterField } from '@/components/shared/table-filter/scope-environment-filter-fields'

export const breadcrumbs = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Exposure', href: '/exposure/overview' },
  { label: 'Remediations', href: '/exposure/remediations' },
]

export const getFilterFields = (enumOptions: EnumOptions) =>
  defineFilterFields<RemediationWhereInput>()([
    {
      key: 'titleContainsFold',
      label: 'Title',
      type: 'text',
      icon: FilterIcons.Source,
    },
    {
      key: 'statusIn',
      label: 'Status',
      type: 'multiselect',
      icon: FilterIcons.Status,
      options: enumOptions.statusOptions,
    },
    {
      key: 'sourceContainsFold',
      label: 'Source',
      type: 'text',
      icon: FilterIcons.Source,
    },
    {
      key: 'externalIDContainsFold',
      label: 'External ID',
      type: 'text',
      icon: FilterIcons.ID,
    },
    getEnvironmentFilterField(enumOptions.environmentOptions),
    getScopeFilterField(enumOptions.scopeOptions),
  ])

export const REMEDIATIONS_SORT_FIELDS = enumToSortFields(RemediationOrderField)

export const visibilityFields = {
  id: false,
  displayID: false,
  title: true,
  summary: false,
  status: true,
  state: false,
  source: true,
  externalID: false,
  externalOwnerID: false,
  externalURI: false,
  ownerReference: false,
  ticketReference: false,
  pullRequestURI: false,
  repositoryURI: false,
  environmentName: false,
  scopeName: false,
  dueAt: true,
  completedAt: false,
  prGeneratedAt: false,
  createdAt: false,
  createdBy: false,
  updatedAt: true,
  updatedBy: false,
}

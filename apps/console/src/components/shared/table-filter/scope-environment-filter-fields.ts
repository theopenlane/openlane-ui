import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type FilterOption } from '@/types'

export const getEnvironmentFilterField = (options: FilterOption[]) =>
  ({
    key: 'environmentNameIn',
    label: 'Environment',
    type: 'multiselect',
    icon: FilterIcons.Environment,
    options,
    nullableKey: 'environmentName',
  }) as const

export const getScopeFilterField = (options: FilterOption[]) =>
  ({
    key: 'scopeNameIn',
    label: 'Scope',
    type: 'multiselect',
    icon: FilterIcons.Scope,
    options,
    nullableKey: 'scopeName',
  }) as const

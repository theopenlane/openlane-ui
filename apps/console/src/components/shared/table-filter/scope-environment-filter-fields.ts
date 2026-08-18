import { type FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'

type FilterOption = { value: string; label: string }

export const getEnvironmentFilterField = (options: FilterOption[]): FilterField => ({
  key: 'environmentNameIn',
  label: 'Environment',
  type: 'multiselect',
  icon: FilterIcons.Environment,
  options,
  nullableKey: 'environmentName',
})

export const getScopeFilterField = (options: FilterOption[]): FilterField => ({
  key: 'scopeNameIn',
  label: 'Scope',
  type: 'multiselect',
  icon: FilterIcons.Scope,
  options,
  nullableKey: 'scopeName',
})

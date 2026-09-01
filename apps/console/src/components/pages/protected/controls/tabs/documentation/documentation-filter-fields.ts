import { type FilterField } from '@/types'

const controlScopedFilterKeys = ['hasControlsWith', 'hasSubcontrolsWith'] as const

export const withoutControlScopedFilters = (fields: FilterField[] | null): FilterField[] | null => fields?.filter((field) => !controlScopedFilterKeys.some((scoped) => scoped === field.key)) ?? null

import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { type FilterOption } from '@/types'

export const getProgramFilterFields = (programOptions: FilterOption[], hasProgramAccess: boolean, label = 'Program Name') =>
  hasProgramAccess
    ? [
        {
          key: 'hasProgramsWith',
          label,
          type: 'multiselect',
          options: programOptions,
          icon: FilterIcons.ProgramName,
        } as const,
      ]
    : []

import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'

type ProgramOption = { value: string; label: string }

export const getProgramFilterFields = (programOptions: ProgramOption[], hasProgramAccess: boolean, label = 'Program Name') =>
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

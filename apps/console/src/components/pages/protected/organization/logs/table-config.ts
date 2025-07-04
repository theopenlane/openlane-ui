import { FilterField, SelectFilterField } from '@/types'

export const LOGS_FILTER_FIELDS: FilterField[] = [
  {
    key: 'table',
    label: 'Table',
    type: 'select',
    options: [{ label: 'Internal Policy', value: 'InternalPolicy' }],
  } as SelectFilterField,
]

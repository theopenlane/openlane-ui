import { FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/task-enum'

export const getVendorsFilterFields = (): FilterField[] => [
  { key: 'displayID', label: 'DisplayID', type: 'text', icon: FilterIcons.DisplayID },
  { key: 'name', label: 'Name', type: 'text', icon: FilterIcons.Title },
]

export const VENDORS_SORT_FIELDS = [{ key: 'name', label: 'Name' }]

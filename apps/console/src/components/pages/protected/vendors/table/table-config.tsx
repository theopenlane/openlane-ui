import { FilterField } from '@/types'
import { TaskFilterIcons } from '@/components/shared/enum-mapper/task-enum'

export const getVendorsFilterFields = (): FilterField[] => [
  { key: 'displayID', label: 'DisplayID', type: 'text', icon: TaskFilterIcons.DisplayID },
  { key: 'name', label: 'Name', type: 'text', icon: TaskFilterIcons.Title },
]

export const VENDORS_SORT_FIELDS = [{ key: 'name', label: 'Name' }]

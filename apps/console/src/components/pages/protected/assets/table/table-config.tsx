import { FilterField } from '@/types'
import { FilterIcons } from '@/components/shared/enum-mapper/task-enum'

export const getAssetsFilterFields = (): FilterField[] => [
  { key: 'displayID', label: 'DisplayID', type: 'text', icon: FilterIcons.DisplayID },
  { key: 'name', label: 'Name', type: 'text', icon: FilterIcons.Title },
]

export const ASSETS_SORT_FIELDS = [{ key: 'name', label: 'Name' }]

import { FilterIcons } from '@/components/shared/enum-mapper/standard-enum'
import { FilterField } from '@/types'

export const getTasksFilterFields = (): FilterField[] => [
  { key: 'systemOwned', label: 'System Owned', type: 'boolean', icon: FilterIcons.SystemOwned },
  { key: 'updatedAt', label: 'Updated At', type: 'dateRange', icon: FilterIcons.UpdatedAt },
  { key: 'createdAt', label: 'Created At', type: 'dateRange', icon: FilterIcons.CreatedAt },
  { key: 'version', label: 'Version', type: 'text', icon: FilterIcons.Version },
  { key: 'revision', label: 'Revision', type: 'text', icon: FilterIcons.Revision },
  { key: 'governingBody', label: 'Governing Body', type: 'text', icon: FilterIcons.GoverningBody },
]

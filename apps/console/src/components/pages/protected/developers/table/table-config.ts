import { FilterIcons } from '@/components/shared/enum-mapper/tokens-enum'
import { FilterField } from '@/types'

export const TOKEN_FILTER_FIELDS: FilterField[] = [
  { key: 'nameContainsFold', label: 'Name', type: 'text', icon: FilterIcons.Name },
  { key: 'expiresAt', label: 'Expires At', type: 'dateRange', icon: FilterIcons.ExpiresAt },
]

export const TOKEN_SORT_FIELDS = [
  {
    key: 'expires_at',
    label: 'Expires At',
  },
  { key: 'is_active', label: 'Is Active' },
  { key: 'last_used_at', label: 'Last Used At' },
  {
    key: 'name',
    label: 'Name',
  },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]

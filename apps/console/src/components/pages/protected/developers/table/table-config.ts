import { FilterField } from '@/types'
import { OrderDirection } from '@repo/codegen/src/schema'

export const TOKEN_FILTER_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'expiresAt', label: 'Expires At', type: 'date' },
]

/*export const TOKEN_SORT_FIELDS = [
  { key: 'description', label: 'Description' },
  {
    key: 'expires_at',
    label: 'Expires At',
    default: {
      key: 'expires_at',
      direction: OrderDirection.ASC,
    },
  },
]*/

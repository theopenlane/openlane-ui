import { FilterField } from '@/types'
import { OrderDirection } from '@repo/codegen/src/schema'
import { Calendar, FileText } from 'lucide-react'

export const TOKEN_FILTER_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text', icon: FileText },
  { key: 'description', label: 'Description', type: 'text', icon: FileText },
  { key: 'expiresAt', label: 'Expires At', type: 'date', icon: Calendar },
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
  {
    key: 'created_at',
    label: 'Created At',
    default: {
      key: 'created_at',
      direction: OrderDirection.DESC,
    },
  },
  { key: 'updated_at', label: 'Updated At' },
]

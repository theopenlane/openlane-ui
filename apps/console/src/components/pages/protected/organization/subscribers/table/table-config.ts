import { FilterField, SelectFilterField } from '@/types'
import { OrderDirection } from '@repo/codegen/src/schema.ts'

export const SUBSCRIBERS_FILTER_FIELDS: FilterField[] = [
  { key: 'email', label: 'Name', type: 'text' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'verifiedEmail', label: 'Verified', type: 'boolean' },
]

export const SUBSCRIBERS_SORT_FIELDS = [
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
  {
    key: 'email',
    label: 'Email',
    default: {
      key: 'email',
      direction: OrderDirection.DESC,
    },
  },
  { key: 'active', label: 'Active' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
]

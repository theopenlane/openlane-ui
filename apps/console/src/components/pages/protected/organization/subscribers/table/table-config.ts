import { FilterField } from '@/types'
import { OrderDirection, SubscriberOrderField } from '@repo/codegen/src/schema.ts'
import { BookOpenCheck, Mail, MailCheck } from 'lucide-react'

export const SUBSCRIBERS_FILTER_FIELDS: FilterField[] = [
  { key: 'email', label: 'Name', type: 'text', icon: Mail },
  { key: 'active', label: 'Active', type: 'boolean', icon: BookOpenCheck },
  { key: 'verifiedEmail', label: 'Verified', type: 'boolean', icon: MailCheck },
]

export const SUBSCRIBERS_SORT_FIELDS = [
  {
    key: 'created_at',
    label: 'Created At',
    default: {
      key: SubscriberOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  },
  { key: 'updated_at', label: 'Updated At' },
  {
    key: 'email',
    label: 'Email',
  },
  { key: 'active', label: 'Active' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
]

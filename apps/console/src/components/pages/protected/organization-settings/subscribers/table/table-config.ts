import { type SubscriberWhereInput } from '@repo/codegen/src/schema'
import { FilterIcons } from '@/components/shared/enum-mapper/subscribers-enum'
import { defineFilterFields } from '@/types'

export const SUBSCRIBERS_FILTER_FIELDS = defineFilterFields<SubscriberWhereInput>()([
  { key: 'email', label: 'Email', type: 'text', icon: FilterIcons.Email },
  { key: 'active', label: 'Active', type: 'boolean', icon: FilterIcons.Active },
  { key: 'verifiedEmail', label: 'Verified', type: 'boolean', icon: FilterIcons.Verified },
])

export const SUBSCRIBERS_SORT_FIELDS = [
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
  { key: 'email', label: 'Email' },
  { key: 'active', label: 'Active' },
  { key: 'unsubscribed', label: 'Unsubscribed' },
]

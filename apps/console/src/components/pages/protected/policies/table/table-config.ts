import { FilterField } from '@/types'
import { OrderDirection } from '@repo/codegen/src/schema.ts'

export const INTERNAL_POLICIES_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'updatedBy', label: 'Last Updated By', type: 'date' },
  { key: 'updatedAt', label: 'Last Updated', type: 'date' },
]

export const INTERNAL_POLICIES_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: 'name',
      direction: OrderDirection.DESC,
    },
  },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_by', label: 'Last Updated By' },
  { key: 'updated_at', label: 'Last Updated' },
]

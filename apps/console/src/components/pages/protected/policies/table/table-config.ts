import { FilterField } from '@/types'
import { InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'

export const INTERNAL_POLICIES_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'updatedBy', label: 'Last Updated By', type: 'date' },
  { key: 'updatedAt', label: 'Last Updated', type: 'date' },
  { key: 'hasProgramsWith', label: 'Program Name', type: 'selectIs' },
]

export const INTERNAL_POLICIES_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: InternalPolicyOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  { key: 'review_due', label: 'Review Due Date' },
  { key: 'revision', label: 'Revision' },
  { key: 'updated_by', label: 'Last Updated By' },
  { key: 'updated_at', label: 'Last Updated' },
]

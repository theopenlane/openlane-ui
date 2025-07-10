import { FilterField } from '@/types'
import { EvidenceOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'

export const EVIDENCE_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'updatedBy', label: 'Last Updated By', type: 'date' },
  { key: 'updatedAt', label: 'Last Updated', type: 'date' },
]

export const EVIDENCE_SORTABLE_FIELDS = [
  { key: 'REVIEW_FREQUENCY', label: 'Review Frequency' },
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: EvidenceOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  { key: 'review_due', label: 'Review Due Date' },
]

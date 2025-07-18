import { FilterField, SelectFilterField } from '@/types'
import { EvidenceOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import { EvidenceStatusOptions } from '@/components/shared/enum-mapper/evidence-enum'

export const EVIDENCE_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'isAutomated', label: 'Is Automated', type: 'boolean' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: EvidenceStatusOptions,
  } as SelectFilterField,
]

export const EVIDENCE_SORTABLE_FIELDS = [
  { key: 'STATUS', label: 'Status' },
  {
    key: 'name',
    label: 'Name',
    default: {
      key: EvidenceOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
]

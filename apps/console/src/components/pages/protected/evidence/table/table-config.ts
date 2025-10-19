import { FilterField } from '@/types'
import { EvidenceOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import { EvidenceStatusOptions, FilterIcons } from '@/components/shared/enum-mapper/evidence-enum'

export const EVIDENCE_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text', icon: FilterIcons.Name },
  { key: 'description', label: 'Description', type: 'text', icon: FilterIcons.Description },
  { key: 'isAutomated', label: 'Is Automated', type: 'boolean', icon: FilterIcons.IsAutomated },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    multiple: true,
    options: EvidenceStatusOptions,
    icon: FilterIcons.Status,
  },
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

import { FilterField } from '@/types'
import { EvidenceOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import { EvidenceStatusOptions } from '@/components/shared/enum-mapper/evidence-enum'
import { ScrollText, Tags } from 'lucide-react'

export const EVIDENCE_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text', icon: ScrollText },
  { key: 'description', label: 'Description', type: 'text', icon: ScrollText },
  { key: 'isAutomated', label: 'Is Automated', type: 'boolean', icon: ScrollText },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: EvidenceStatusOptions,
    icon: Tags,
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

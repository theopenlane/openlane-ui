import { FilterField, SelectFilterField } from '@/types'
import { EvidenceEvidenceStatus, EvidenceOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'

const statusLabels: Record<EvidenceEvidenceStatus, string> = {
  [EvidenceEvidenceStatus.APPROVED]: 'Approved',
  [EvidenceEvidenceStatus.REJECTED]: 'Rejected',
  [EvidenceEvidenceStatus.NEEDS_RENEWAL]: 'Needs Renewal',
  [EvidenceEvidenceStatus.READY]: 'Ready',
  [EvidenceEvidenceStatus.MISSING_ARTIFACT]: 'Missing Artifact',
}

const statusOptions = Object.values(EvidenceEvidenceStatus).map((status) => ({
  label: statusLabels[status],
  value: status,
}))

export const EVIDENCE_FILTERABLE_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'description', label: 'Description', type: 'text' },
  { key: 'isAutomated', label: 'Is Automated', type: 'boolean' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: statusOptions,
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

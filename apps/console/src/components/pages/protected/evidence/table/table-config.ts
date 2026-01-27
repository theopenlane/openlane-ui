import { FilterField } from '@/types'
import { EvidenceOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import { EvidenceStatusOptions, FilterIcons } from '@/components/shared/enum-mapper/evidence-enum'

export const getEvidenceFilterableFields = (frameworkOptions: { value: string; label: string }[]): FilterField[] => [
  { key: 'name', label: 'Name', type: 'text', icon: FilterIcons.Name },
  { key: 'description', label: 'Description', type: 'text', icon: FilterIcons.Description },
  { key: 'isAutomated', label: 'Is Automated', type: 'boolean', icon: FilterIcons.IsAutomated },
  {
    key: 'statusIn',
    label: 'Status',
    type: 'multiselect',
    options: EvidenceStatusOptions,
    icon: FilterIcons.Status,
  },
  { key: 'source', label: 'Source', type: 'text', icon: FilterIcons.Description },
  { key: 'creationDate', label: 'Created', type: 'dateRange', icon: FilterIcons.Date },
  { key: 'updatedAt', label: 'Updated', type: 'dateRange', icon: FilterIcons.Date },
  { key: 'renewalDate', label: 'Renewed', type: 'dateRange', icon: FilterIcons.Date },
  {
    key: 'satisfiesFramework',
    label: 'Satisfies',
    type: 'multiselect',
    icon: FilterIcons.Status,
    options: frameworkOptions,
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

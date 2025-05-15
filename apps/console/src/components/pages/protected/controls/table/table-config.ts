import { FilterField, SelectFilterField } from '@/types'
import { ControlControlStatus, OrderDirection } from '@repo/codegen/src/schema.ts'

const statusLabels: Record<ControlControlStatus, string> = {
  APPROVED: 'Approved',
  ARCHIVED: 'Archived',
  CHANGES_REQUESTED: 'Changes requested',
  NEEDS_APPROVAL: 'Needs approval',
  NOT_IMPLEMENTED: 'Not implemented',
  PREPARING: 'Preparing',
}

const statusOptions = Object.values(ControlControlStatus)
  .filter((status) => status !== 'NOT_IMPLEMENTED')
  .map((status) => ({
    label: statusLabels[status],
    value: status,
  }))
export const CONTROLS_FILTER_FIELDS: FilterField[] = [
  { key: 'refCode', label: 'RefCode', type: 'text' },
  { key: 'program', label: 'Program', type: 'containsText' },
  { key: 'standard', label: 'Standard', type: 'containsText' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: statusOptions,
  } as SelectFilterField,
]

export const CONTROLS_SORT_FIELDS = [
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
  { key: 'status', label: 'Status' },
  { key: 'SOURCE', label: 'Source' },
  { key: 'CONTROL_TYPE', label: 'Control Type' },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  {
    key: 'ref_code',
    label: 'Ref',
    default: {
      key: 'ref_code',
      direction: OrderDirection.DESC,
    },
  },
]

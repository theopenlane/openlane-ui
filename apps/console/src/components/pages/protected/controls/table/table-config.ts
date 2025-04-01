import { FilterField, SelectFilterField } from '@/types'
import { OrderDirection } from '@repo/codegen/src/schema.ts'

export const CONTROLS_FILTER_FIELDS: FilterField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'ref', label: 'Ref', type: 'text' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    //@todo for Bruno
    options: [{ label: 'In progress', value: 'In Progress' }],
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

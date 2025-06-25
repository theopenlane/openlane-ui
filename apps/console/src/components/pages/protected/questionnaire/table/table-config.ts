import { FilterField } from '@/types'
import { OrderDirection, TemplateOrderField } from '@repo/codegen/src/schema.ts'

export const QUESTIONNAIRE_FILTER_FIELDS: FilterField[] = [
  { key: 'name', label: 'Task', type: 'text' },
  { key: 'description', label: 'Title', type: 'text' },
  { key: 'updated_at', label: 'Updated At', type: 'date' },
  { key: 'created_at', label: 'Created At', type: 'date' },
]

export const QUESTIONNAIRE_SORT_FIELDS = [
  {
    key: 'name',
    label: 'Name',
    default: {
      key: TemplateOrderField.name,
      direction: OrderDirection.ASC,
    },
  },
  { key: 'TEMPLATE_TYPE', label: 'Type' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Updated At' },
]

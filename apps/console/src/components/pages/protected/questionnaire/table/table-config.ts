import { FilterIcons } from '@/components/shared/enum-mapper/questionnaire-enum'
import { FilterField } from '@/types'
import { OrderDirection, TemplateOrderField } from '@repo/codegen/src/schema.ts'

export const QUESTIONNAIRE_FILTER_FIELDS: FilterField[] = [
  { key: 'description', label: 'Title', type: 'text', icon: FilterIcons.Title },
  { key: 'updatedAt', label: 'Updated At', type: 'dateRange', icon: FilterIcons.UpdatedAt },
  { key: 'createdAt', label: 'Created At', type: 'dateRange', icon: FilterIcons.CreatedAt },
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

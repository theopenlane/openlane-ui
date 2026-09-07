import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons } from '@/components/shared/enum-mapper/questionnaire-enum'
import { defineFilterFields, type FilterOption } from '@/types'
import { OrderDirection, AssessmentOrderField, AssessmentAssessmentType, type AssessmentWhereInput } from '@repo/codegen/src/schema.ts'
import { getTagsFilterField } from '@/components/shared/table-filter/tags-filter-field'

export const QUESTIONNAIRE_REMAPPED_FILTER_KEYS = ['dueDate'] as const

export const getQuestionnaireFilterFields = (tagOptions: FilterOption[], templateOptions: FilterOption[]) =>
  defineFilterFields<AssessmentWhereInput, (typeof QUESTIONNAIRE_REMAPPED_FILTER_KEYS)[number]>()([
    getTagsFilterField(tagOptions),
    {
      key: 'assessmentTypeIn',
      label: 'Type',
      type: 'multiselect',
      icon: FilterIcons.Type,
      options: enumToOptions(AssessmentAssessmentType),
    },
    { key: 'templateID', label: 'Template', type: 'dropdownSearchSingleSelect', icon: FilterIcons.Template, options: templateOptions },
    { key: 'dueDate', label: 'Due Date', type: 'dateRange', icon: FilterIcons.DueDate },
    { key: 'updatedAt', label: 'Updated At', type: 'dateRange', icon: FilterIcons.UpdatedAt },
    { key: 'createdAt', label: 'Created At', type: 'dateRange', icon: FilterIcons.CreatedAt },
  ])

export const QUESTIONNAIRE_SORT_FIELDS = [
  {
    key: 'updated_at',
    label: 'Updated At',
    default: {
      key: AssessmentOrderField.updated_at,
      direction: OrderDirection.DESC,
    },
  },
  { key: 'name', label: 'Name' },
  { key: 'assessment_type', label: 'Type' },
  { key: 'created_at', label: 'Created At' },
]

export const mapQuestionnaireFilterKey = (key: string, value: unknown): AssessmentWhereInput => {
  if (key.startsWith('dueDate')) {
    return { hasAssessmentResponsesWith: [{ [key]: value }] }
  }

  return { [key]: value }
}

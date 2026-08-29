import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons } from '@/components/shared/enum-mapper/questionnaire-enum'
import { defineFilterFields } from '@/types'
import { OrderDirection, AssessmentOrderField, AssessmentAssessmentType, type AssessmentWhereInput } from '@repo/codegen/src/schema.ts'

type Option = { value: string; label: string }

export const QUESTIONNAIRE_REMAPPED_FILTER_KEYS = ['dueDate'] as const

export const getQuestionnaireFilterFields = (tagOptions: Option[], templateOptions: Option[]) =>
  defineFilterFields<AssessmentWhereInput, (typeof QUESTIONNAIRE_REMAPPED_FILTER_KEYS)[number]>()([
    { key: 'tagsHas', label: 'Tags', type: 'dropdownSearchSingleSelect', icon: FilterIcons.Tags, options: tagOptions },
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

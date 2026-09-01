import { AssessmentResponseAssessmentResponseStatus, type AssessmentResponseWhereInput } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { FilterIcons, QuestionnaireFilterIconName } from '@/components/shared/enum-mapper/questionnaire-enum'
import { defineFilterFields } from '@/types'

export const deliveryFilterFields = defineFilterFields<AssessmentResponseWhereInput>()([
  {
    key: 'status',
    label: 'Status',
    type: 'multiselect',
    icon: FilterIcons[QuestionnaireFilterIconName.Status],
    options: enumToOptions(AssessmentResponseAssessmentResponseStatus),
  },
  {
    key: 'assignedAt',
    label: 'Sent Date',
    type: 'dateRange',
    icon: FilterIcons[QuestionnaireFilterIconName.SentDate],
  },
  {
    key: 'dueDate',
    label: 'Due Date',
    type: 'dateRange',
    icon: FilterIcons[QuestionnaireFilterIconName.DueDate],
  },
])

export const mapDeliveryFilterKey = (key: string, value: unknown): AssessmentResponseWhereInput => {
  if (key === 'status') {
    return Array.isArray(value) ? { statusIn: value as AssessmentResponseAssessmentResponseStatus[] } : { status: value as AssessmentResponseAssessmentResponseStatus }
  }

  return { [key]: value }
}

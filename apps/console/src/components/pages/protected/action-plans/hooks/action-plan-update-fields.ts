import { type UpdateActionPlanInput } from '@repo/codegen/src/schema'
import { dateOrClear, omit, orClear, type TFieldMappers, passthrough } from '@/hooks/useDirtyInput'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { type ActionPlanFormData } from './use-form-schema'

export const ACTION_PLAN_UPDATE_FIELDS = {
  descriptionJSON: async (value, _values, { converter }) => {
    const description = await plateToHtmlOrNull(value, converter)
    return description ? { description } : { clearDescription: true }
  },
  description: omit,
  source: orClear('clearSource'),
  status: orClear('clearStatus'),
  priority: orClear('clearPriority'),
  reviewFrequency: orClear('clearReviewFrequency'),
  dueDate: dateOrClear('clearDueDate'),
  reviewDue: dateOrClear('clearReviewDue'),
  name: passthrough,
  title: passthrough,
} satisfies TFieldMappers<ActionPlanFormData, UpdateActionPlanInput>

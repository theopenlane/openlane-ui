import { type UpdateControlObjectiveInput } from '@repo/codegen/src/schema'
import { omit, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type TFormData } from './use-form-schema'

export const CONTROL_OBJECTIVE_UPDATE_FIELDS = {
  desiredOutcome: richTextOrClear('clearDesiredOutcome'),
  status: orClear('clearStatus'),
  source: orClear('clearSource'),
  controlObjectiveType: orClear('clearControlObjectiveType'),
  category: orClear('clearCategory'),
  subcategory: orClear('clearSubcategory'),
  id: omit,
} satisfies Partial<TFieldMappers<TFormData, UpdateControlObjectiveInput>>

export const revisionBumpExtras = ({ RevisionBump }: TFormData): Partial<UpdateControlObjectiveInput> => (RevisionBump ? { RevisionBump } : {})

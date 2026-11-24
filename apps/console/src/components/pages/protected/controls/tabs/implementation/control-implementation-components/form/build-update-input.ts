import { type UpdateControlImplementationInput } from '@repo/codegen/src/schema'
import { dateOrClear, omit, orClear, richTextOrClear, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type TFormData } from './use-form-schema'

export const CONTROL_IMPLEMENTATION_UPDATE_FIELDS = {
  details: richTextOrClear('clearDetails'),
  implementationDate: dateOrClear('clearImplementationDate'),
  status: orClear('clearStatus'),
  tags: orClear('clearTags'),
  controlIDs: omit,
  subcontrolIDs: omit,
  id: omit,
  revision: omit,
} satisfies TFieldMappers<TFormData, UpdateControlImplementationInput>

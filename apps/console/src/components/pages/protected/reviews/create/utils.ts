import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { ReviewFormData } from '../hooks/use-form-schema'
import { Value } from 'platejs'

export const buildPayload = async (data: ReviewFormData, plateEditorHelper: ReturnType<typeof usePlateEditor>) => {
  const details = data.details ? await plateEditorHelper.convertToHtml(data?.details as Value) : undefined

  return {
    ...data,
    details,
  }
}

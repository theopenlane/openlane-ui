import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { VulnerabilityFormData } from '../hooks/use-form-schema'
import { Value } from 'platejs'

export const buildPayload = async (data: VulnerabilityFormData, plateEditorHelper: ReturnType<typeof usePlateEditor>) => {
  const description = data.description ? await plateEditorHelper.convertToHtml(data?.description as Value) : undefined

  return {
    ...data,
    description,
  }
}

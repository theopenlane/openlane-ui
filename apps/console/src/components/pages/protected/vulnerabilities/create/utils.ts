import type usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type VulnerabilityFormData } from '../hooks/use-form-schema'
import { type Value } from 'platejs'

export const buildPayload = async (data: VulnerabilityFormData, plateEditorHelper: ReturnType<typeof usePlateEditor>) => {
  const description = data.description ? await plateEditorHelper.convertToHtml(data?.description as Value) : undefined

  return {
    ...data,
    description,
  }
}

import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { EditAssetFormData } from '../hooks/use-form-schema'
import { Value } from 'platejs'

export const buildPayload = async (
  data: EditAssetFormData,

  plateEditorHelper: ReturnType<typeof usePlateEditor>,
) => {
  const description = data.description ? await plateEditorHelper.convertToHtml(data?.description as Value) : undefined

  return {
    ...data,
    description,
  }
}

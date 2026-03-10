import type usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type ReviewFormData } from '../hooks/use-form-schema'
import { type Value } from 'platejs'

const toISOString = (value: string | Date | null | undefined): string | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  return value
}

export const buildPayload = async (data: ReviewFormData, plateEditorHelper: ReturnType<typeof usePlateEditor>) => {
  const details = data.details ? await plateEditorHelper.convertToHtml(data?.details as Value) : undefined

  return {
    ...data,
    details,
    approvedAt: toISOString(data.approvedAt),
    reportedAt: toISOString(data.reportedAt),
    reviewedAt: toISOString(data.reviewedAt),
  }
}

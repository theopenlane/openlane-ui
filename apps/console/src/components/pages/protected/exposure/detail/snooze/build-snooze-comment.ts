import { plainTextToPlateValue, plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import type usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { formatDate } from '@/utils/date'

export const buildSnoozeCommentHtml = async (until: Date, comment: string, converter: ReturnType<typeof usePlateEditor>): Promise<string | null> => {
  const trimmedComment = comment.trim()
  if (!trimmedComment) return null
  return plateToHtmlOrNull([...plainTextToPlateValue(`Snoozed until ${formatDate(until.toISOString())}.`), ...plainTextToPlateValue(trimmedComment)], converter)
}

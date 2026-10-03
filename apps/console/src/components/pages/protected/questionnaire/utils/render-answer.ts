import { PDF_DOCUMENT_QUESTION_TYPE } from '@/components/shared/survey/pdf-document/pdf-document-type'

export const renderAnswer = (value: unknown, questionType?: string): string => {
  if (questionType === PDF_DOCUMENT_QUESTION_TYPE) return value === true ? 'Read' : 'Not read'
  if (value == null) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

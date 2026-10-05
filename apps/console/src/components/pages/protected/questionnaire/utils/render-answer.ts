import { PDF_DOCUMENT_QUESTION_TYPE, renderPdfDocumentAnswer } from '@/components/shared/survey/pdf-document/pdf-document-type'
import { ACKNOWLEDGEMENT_QUESTION_TYPE, renderAcknowledgementAnswer } from '@/components/shared/survey/acknowledgement/acknowledgement-type'

const CUSTOM_QUESTION_ANSWER_RENDERERS: Record<string, (value: unknown) => string> = {
  [PDF_DOCUMENT_QUESTION_TYPE]: renderPdfDocumentAnswer,
  [ACKNOWLEDGEMENT_QUESTION_TYPE]: renderAcknowledgementAnswer,
}

export const renderAnswer = (value: unknown, questionType?: string): string => {
  const renderCustomAnswer = questionType ? CUSTOM_QUESTION_ANSWER_RENDERERS[questionType] : undefined
  if (renderCustomAnswer) return renderCustomAnswer(value)
  if (value == null) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

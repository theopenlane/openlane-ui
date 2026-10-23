import {
  ACKNOWLEDGEMENT_QUESTION_TYPE,
  PDF_DOCUMENT_QUESTION_TYPE,
  renderAcknowledgementAnswer,
  renderPdfDocumentAnswer,
  renderSignatureAnswer,
  renderSignaturePadAnswer,
  SIGNATURE_PAD_QUESTION_TYPE,
  SIGNATURE_QUESTION_TYPE,
} from '@theopenlane/surveyjs-components'

const CUSTOM_QUESTION_ANSWER_RENDERERS: Record<string, (value: unknown) => string> = {
  [PDF_DOCUMENT_QUESTION_TYPE]: renderPdfDocumentAnswer,
  [ACKNOWLEDGEMENT_QUESTION_TYPE]: renderAcknowledgementAnswer,
  [SIGNATURE_PAD_QUESTION_TYPE]: renderSignaturePadAnswer,
  [SIGNATURE_QUESTION_TYPE]: renderSignatureAnswer,
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

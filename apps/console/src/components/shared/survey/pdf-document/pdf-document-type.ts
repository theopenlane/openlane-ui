import type { AssessmentPoliciesInput } from '@repo/codegen/src/schema'
import { isRecord } from '@/utils/type-guards'

export const PDF_DOCUMENT_QUESTION_TYPE = 'pdfdocument'

export const PDF_DOCUMENT_READ_LABEL = 'Read'
export const PDF_DOCUMENT_UNREAD_LABEL = 'Not read'

export const PDF_DATA_URL_PREFIX = 'data:application/pdf;base64,'
export const PDF_DOCUMENT_EMBED_BUDGET_MB = 2
export const PDF_DOCUMENT_EMBED_BUDGET_BYTES = PDF_DOCUMENT_EMBED_BUDGET_MB * 1024 * 1024

export const pdfDocumentTitleFromFileName = (fileName: string) =>
  fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()

export const isPdfDataUrl = (value: string) => value.startsWith(PDF_DATA_URL_PREFIX)

export const renderPdfDocumentAnswer = (value: unknown): string => (value === true ? PDF_DOCUMENT_READ_LABEL : PDF_DOCUMENT_UNREAD_LABEL)

export type TPdfDocumentAttachment = {
  pdfData: string
  pdfFileName: string
  policyId?: string
  policyRevision?: string
  suggestedTitle?: string
}

export const pdfDocumentAttachmentTitle = ({ suggestedTitle, pdfFileName }: Pick<TPdfDocumentAttachment, 'suggestedTitle' | 'pdfFileName'>) =>
  suggestedTitle?.trim() || pdfDocumentTitleFromFileName(pdfFileName)

export const toPdfDocumentQuestionJson = (name: string, attachment: TPdfDocumentAttachment) => {
  const { pdfData, pdfFileName, policyId, policyRevision } = attachment
  return { type: PDF_DOCUMENT_QUESTION_TYPE, name, title: pdfDocumentAttachmentTitle(attachment), pdfData, pdfFileName, policyId, policyRevision }
}

const NESTED_ELEMENT_KEYS = ['pages', 'elements', 'questions', 'templateElements', 'detailElements'] as const

const collectPolicySources = (node: unknown): AssessmentPoliciesInput[] => {
  if (Array.isArray(node)) return node.flatMap(collectPolicySources)
  if (!isRecord(node)) return []

  const { type, policyId, policyRevision } = node
  const own: AssessmentPoliciesInput[] =
    type === PDF_DOCUMENT_QUESTION_TYPE && typeof policyId === 'string' && policyId
      ? [{ internalPolicyID: policyId, policyRevision: typeof policyRevision === 'string' && policyRevision ? policyRevision : undefined }]
      : []

  return [...own, ...NESTED_ELEMENT_KEYS.flatMap((key) => collectPolicySources(node[key]))]
}

export const getSurveyPolicySources = (surveyJson: unknown): AssessmentPoliciesInput[] =>
  collectPolicySources(surveyJson).filter((source, index, sources) => sources.findIndex(({ internalPolicyID }) => internalPolicyID === source.internalPolicyID) === index)

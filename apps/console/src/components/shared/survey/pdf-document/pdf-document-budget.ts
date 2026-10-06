import { formatFileSize } from '@/utils/strings'
import { PDF_DOCUMENT_EMBED_BUDGET_BYTES, PDF_DOCUMENT_EMBED_BUDGET_MB } from './pdf-document-type'

export const embedBudgetExceededMessage = (documentLabel: string, sizeBytes: number, remainingBytes: number) => {
  const usedBytes = PDF_DOCUMENT_EMBED_BUDGET_BYTES - remainingBytes
  const usage = usedBytes > 0 ? `, and ${formatFileSize(usedBytes)} is already used by other documents` : ''
  return `${documentLabel} is ${formatFileSize(sizeBytes)}. Embedded documents in a questionnaire are limited to ${PDF_DOCUMENT_EMBED_BUDGET_MB} MB in total${usage}.`
}

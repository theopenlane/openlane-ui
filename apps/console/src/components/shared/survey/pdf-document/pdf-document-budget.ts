import { formatFileSize } from '@/utils/strings'

// PDF_DOCUMENT_EMBED_BUDGET_MB caps the combined size of the PDFs embedded in one questionnaire
// they are stored base64 encoded in its json, so every load of the questionnaire carries them
export const PDF_DOCUMENT_EMBED_BUDGET_MB = 10
export const PDF_DOCUMENT_EMBED_BUDGET_BYTES = PDF_DOCUMENT_EMBED_BUDGET_MB * 1024 * 1024

export const embedBudgetExceededMessage = (documentLabel: string, sizeBytes: number, remainingBytes: number) => {
  const usedBytes = PDF_DOCUMENT_EMBED_BUDGET_BYTES - remainingBytes
  const usage = usedBytes > 0 ? `, and ${formatFileSize(usedBytes)} is already used by other documents` : ''
  return `${documentLabel} is ${formatFileSize(sizeBytes)}. Embedded documents in a questionnaire are limited to ${PDF_DOCUMENT_EMBED_BUDGET_MB} MB in total${usage}.`
}

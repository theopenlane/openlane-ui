export const PDF_DOCUMENT_QUESTION_TYPE = 'pdfdocument'

export const PDF_DOCUMENT_READ_LABEL = 'Read'
export const PDF_DOCUMENT_UNREAD_LABEL = 'Not read'

export const PDF_DATA_URL_PREFIX = 'data:application/pdf;base64,'
export const PDF_DOCUMENT_EMBED_BUDGET_MB = 2
export const PDF_DOCUMENT_EMBED_BUDGET_BYTES = PDF_DOCUMENT_EMBED_BUDGET_MB * 1024 * 1024

export const isPdfDataUrl = (value: string) => value.startsWith(PDF_DATA_URL_PREFIX)

export const renderPdfDocumentAnswer = (value: unknown): string => (value === true ? PDF_DOCUMENT_READ_LABEL : PDF_DOCUMENT_UNREAD_LABEL)

export const PDF_DOCUMENT_QUESTION_TYPE = 'pdfdocument'

export const renderPdfDocumentAnswer = (value: unknown): string => (value === true ? 'Read' : 'Not read')

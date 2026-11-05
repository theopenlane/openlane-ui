export const acceptedFileTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'text/plain; charset=utf-8',
  'application/zip',
  'application/rtf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/x-vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  'application/x-yaml',
  'application/x-yaml; charset=utf-8',
  'text/yaml',
  'application/json',
  'application/json; charset=utf-8',
]

export const acceptedFileTypesShort = ['PDF', 'DOC(X)', 'CSV', 'XLSX', 'TXT', 'PNG', 'JPG', 'ZIP', 'YAML']

export const wordAcceptedFileTypes = ['.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
export const wordAcceptedFileTypesShort = ['DOC', 'DOCX']

export const maxFileSizeInMb = 100

export const pdfAcceptedFileTypes = ['application/pdf']
export const pdfAcceptedFileTypesShort = ['PDF']

// externalReferenceAcceptedFileTypes are the document types a policy can be kept as an external reference for
export const externalReferenceAcceptedFileTypes = [...wordAcceptedFileTypes, ...pdfAcceptedFileTypes]
export const externalReferenceAcceptedFileTypesShort = [...wordAcceptedFileTypesShort, ...pdfAcceptedFileTypesShort]

export const markdownAcceptedFileTypes = ['text/plain; charset=utf-8', 'text/plain', 'text/markdown', 'text/x-markdown', 'text/mdx', '.mdx', '.md']
export const markdownAcceptedFileTypesShort = ['TXT', 'MD', 'MDX']

// documentImportAcceptedFileTypes are the files a procedure can be imported from
export const documentImportAcceptedFileTypes = [...markdownAcceptedFileTypes, ...wordAcceptedFileTypes]
export const documentImportAcceptedFileTypesShort = [...markdownAcceptedFileTypesShort, ...wordAcceptedFileTypesShort]

// policyImportAcceptedFileTypes are the files a policy can be imported from, which also include PDFs
export const policyImportAcceptedFileTypes = [...markdownAcceptedFileTypes, ...externalReferenceAcceptedFileTypes]
export const policyImportAcceptedFileTypesShort = [...markdownAcceptedFileTypesShort, ...externalReferenceAcceptedFileTypesShort]

export const imageAcceptedFileTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']
export const imageAcceptedFileTypesShort = ['PNG', 'JPG', 'SVG', 'WEBP', 'GIF']

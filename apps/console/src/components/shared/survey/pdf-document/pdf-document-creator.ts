import { settings } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { PDF_DOCUMENT_QUESTION_TYPE } from './pdf-document-type'
import './pdf-document-question'

const enLocale = editorLocalization.getLocale('en')

enLocale.qt[PDF_DOCUMENT_QUESTION_TYPE] = 'PDF Document'
enLocale.pe.pdfUrl = 'PDF URL'
enLocale.pehelp.pdfUrl =
  'Prefer uploading the PDF or picking a policy on the question itself, which embeds the document. A URL must be HTTPS and from a host that allows the file to be embedded on other sites (CORS), or it can only be opened in a new tab.'
enLocale.pe.pdfFileName = 'Document'
enLocale.pe.policyId = 'Policy ID'
enLocale.pe.policyRevision = 'Policy revision'
enLocale.pehelp.policyRevision = 'The policy revision the embedded PDF was exported from. Attach the policy again to pick up a newer revision.'

const customIcons: Record<string, string> = settings.customIcons
customIcons[`icon-${PDF_DOCUMENT_QUESTION_TYPE}`] = 'icon-file'

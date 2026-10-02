import { settings } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { PDF_DOCUMENT_QUESTION_TYPE } from './pdf-document-type'
import './pdf-document-question'

const enLocale = editorLocalization.getLocale('en')

enLocale.qt[PDF_DOCUMENT_QUESTION_TYPE] = 'PDF Document'
enLocale.pe.pdfUrl = 'PDF URL'
enLocale.pehelp.pdfUrl =
  'Respondents must scroll to the end of this PDF before they can continue, unless the question is optional. Use an HTTPS link from a host that allows the file to be embedded on other sites (CORS), or it can only be opened in a new tab.'

const customIcons: Record<string, string> = settings.customIcons
customIcons[`icon-${PDF_DOCUMENT_QUESTION_TYPE}`] = 'icon-file'

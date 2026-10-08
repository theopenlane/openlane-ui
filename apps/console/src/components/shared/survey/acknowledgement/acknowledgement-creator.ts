import { settings } from 'survey-core'
import { editorLocalization } from 'survey-creator-core'
import { ACKNOWLEDGEMENT_QUESTION_TYPE } from './acknowledgement-type'
import './acknowledgement-signature'

const enLocale = editorLocalization.getLocale('en')

enLocale.qt[ACKNOWLEDGEMENT_QUESTION_TYPE] = 'Acknowledgement'
enLocale.pe.statement = 'Acknowledgement statement'
enLocale.pehelp.statement = 'The text shown next to the checkbox respondents tick before they sign.'
enLocale.pe.lockUntilAcknowledged = 'Lock name and signature until acknowledged'
enLocale.pehelp.lockUntilAcknowledged = 'Respondents cannot enter their name or sign until they tick the acknowledgement checkbox.'

const customIcons: Record<string, string> = settings.customIcons
customIcons[`icon-${ACKNOWLEDGEMENT_QUESTION_TYPE}`] = 'icon-signaturepad'

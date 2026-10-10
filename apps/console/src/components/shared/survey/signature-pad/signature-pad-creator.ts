import { settings } from 'survey-creator-core'
import { FULL_WIDTH_SIGNATURE_PAD, SIGNATURE_PAD_QUESTION_TYPE } from './signature-pad-type'

settings.toolbox.defaultJSON[SIGNATURE_PAD_QUESTION_TYPE] = { ...FULL_WIDTH_SIGNATURE_PAD }

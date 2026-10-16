import { Model } from 'survey-core'
import './pdf-document/pdf-document-question'
import './signature-pad/signature-pad-model'
import './acknowledgement/acknowledgement-model'
import './signature/signature-model'
import './signature/signature-field'

export const createSurveyModel = (json: object | null | undefined) => new Model(json)

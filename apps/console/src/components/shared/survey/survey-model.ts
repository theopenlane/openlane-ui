import { Model } from 'survey-core'
import './pdf-document/pdf-document-question'
import './acknowledgement/acknowledgement-signature'

export const createSurveyModel = (json: object | null | undefined) => new Model(json)

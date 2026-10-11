import { type ITheme, Model } from 'survey-core'
import { createSurveyTheme } from '@/components/shared/survey/survey-theme'
import './pdf-document/pdf-document-question'
import './acknowledgement/acknowledgement-signature'

export const createSurveyModel = (json: object | null | undefined, theme: ITheme = createSurveyTheme()) => {
  const model = new Model(json)
  model.applyTheme(theme)
  return model
}

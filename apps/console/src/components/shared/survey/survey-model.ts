import { type ITheme, Model } from 'survey-core'
import '@theopenlane/surveyjs-components/survey'
import '@theopenlane/surveyjs-components/styles.css'
import { createSurveyTheme } from '@/components/shared/survey/survey-theme'
import './pdf-document/pdf-document-question'
import './signature/signature-field'

export const createSurveyModel = (json: object | null | undefined, theme: ITheme = createSurveyTheme()) => {
  const model = new Model(json)
  model.applyTheme(theme)
  return model
}

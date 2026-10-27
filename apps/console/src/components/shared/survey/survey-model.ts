import { type ITheme, Model, Serializer, type SurveyModel } from 'survey-core'
import '@theopenlane/surveyjs-components/survey'
import '@theopenlane/surveyjs-components/styles.css'
import { createSurveyTheme } from '@/components/shared/survey/survey-theme'
import { isSafeLinkHref, sanitizeHtml } from '@/lib/html/sanitize-html'
import './pdf-document/pdf-document-question'
import './signature/signature-field'

const UNSAFE_SURVEY_PROPERTIES = [
  ['selectbase', 'choicesByUrl'],
  ['survey', 'cookieName'],
  ['survey', 'surveyId'],
  ['survey', 'surveyPostId'],
] as const

UNSAFE_SURVEY_PROPERTIES.forEach(([className, propertyName]) => Serializer.removeProperty(className, propertyName))

export const hardenSurveyModel = (survey: SurveyModel) => {
  const processHtml = survey.processHtml.bind(survey)
  survey.processHtml = (html, reason) => sanitizeHtml(processHtml(html, reason))
  survey.onNavigateToUrl.add((_survey, options) => {
    if (!isSafeLinkHref(options.url, window.location.origin)) options.allow = false
  })
}

export const createSurveyModel = (json: object | null | undefined, theme: ITheme = createSurveyTheme()) => {
  const model = new Model(json)
  hardenSurveyModel(model)
  model.applyTheme(theme)
  return model
}

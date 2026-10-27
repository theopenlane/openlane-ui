import { slk } from 'survey-core'
import { type ICreatorOptions } from 'survey-creator-core'
import { SurveyCreator } from 'survey-creator-react'
import { surveyLicenseKey } from '@repo/dally/auth'

import 'survey-core/survey-core.min.css'
import 'survey-creator-core/survey-creator-core.min.css'

import { createSurveyTheme } from '@/components/shared/survey/survey-theme'
import { hardenSurveyModel } from '@/components/shared/survey/survey-model'
import '@/components/shared/survey/survey-creator-types'

if (surveyLicenseKey) slk(surveyLicenseKey)

const QUESTIONNAIRE_CONTENT_AREAS = new Set(['designer-tab', 'preview-tab'])

export const createSurveyCreator = (options: ICreatorOptions) => {
  const creator = new SurveyCreator({ ...options, showThemeTab: false })
  creator.toolbox.forceCompact = false
  creator.toolbox.removeItem('html')
  creator.onSurveyInstanceCreated.add((_creator, { area, survey }) => {
    if (QUESTIONNAIRE_CONTENT_AREAS.has(area)) hardenSurveyModel(survey)
  })
  creator.applyCreatorTheme(createSurveyTheme())
  creator.theme = createSurveyTheme()
  return creator
}

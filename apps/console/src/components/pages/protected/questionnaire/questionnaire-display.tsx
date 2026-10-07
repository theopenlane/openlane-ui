'use client'

import { type ITheme } from 'survey-core'
import { Survey } from 'survey-react-ui'
import { useMemo } from 'react'
import { useTheme } from 'next-themes'
import { createSurveyModel } from '@/components/shared/survey/survey-model'
import { attachSurveyProgressText } from '@/components/shared/survey/survey-progress-text'
import { lightTheme } from '@/styles/questionnaire/theme-light'
import { darkTheme } from '@/styles/questionnaire/theme-dark'

import 'survey-core/survey-core.min.css'
import '@/styles/questionnaire/survey-viewer.css'

export const QuestionnaireDisplay = ({ json }: { json: object | null | undefined }) => {
  const { resolvedTheme } = useTheme()

  const survey = useMemo(() => {
    const model = createSurveyModel(json)
    attachSurveyProgressText(model)
    model.applyTheme(resolvedTheme === 'dark' ? (darkTheme as ITheme) : lightTheme)
    model.showCompleteButton = false
    model.mode = 'display'
    return model
  }, [json, resolvedTheme])

  return <Survey model={survey} />
}

'use client'

import { Survey } from 'survey-react-ui'
import { useMemo } from 'react'
import { createSurveyModel } from '@/components/shared/survey/survey-model'
import { attachSurveyProgressText } from '@/components/shared/survey/survey-progress-text'

import '@/styles/questionnaire/survey-viewer.css'

export const QuestionnaireDisplay = ({ json }: { json: object | null | undefined }) => {
  const survey = useMemo(() => {
    const model = createSurveyModel(json)
    attachSurveyProgressText(model)
    model.showCompleteButton = false
    model.mode = 'display'
    return model
  }, [json])

  return <Survey model={survey} />
}

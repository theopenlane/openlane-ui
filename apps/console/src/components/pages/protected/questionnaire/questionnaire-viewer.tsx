'use client'

import { type ITheme, Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

import 'survey-core/survey-core.min.css'
import '@/styles/questionnaire/survey-viewer.css'

import { useEffect, useMemo, use } from 'react'
import { useTheme } from 'next-themes'
import { lightTheme } from '@/styles/questionnaire/theme-light'
import { darkTheme } from '@/styles/questionnaire/theme-dark'
import { useGetAssessment } from '@/lib/graphql-hooks/assessment'
import { attachSurveyProgressText } from '@/components/shared/survey/survey-progress-text'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

export default function ViewQuestionnaire(input: { existingId: string }) {
  const { setCrumbs } = use(BreadcrumbContext)
  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  const { data: assessmentResult } = useGetAssessment(input.existingId)
  const surveyJson = assessmentResult?.assessment?.jsonconfig
  const survey = useMemo(() => {
    const model = new Model(surveyJson)
    attachSurveyProgressText(model)
    model.applyTheme(theme === 'dark' ? (darkTheme as ITheme) : lightTheme)
    model.showCompleteButton = false
    model.mode = 'display'
    return model
  }, [surveyJson, theme])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/questionnaires' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Questionnaire Viewer', href: '/automation/questionnaires/questionnaire-viewer' },
    ])
  }, [setCrumbs])

  return <Survey model={survey} />
}

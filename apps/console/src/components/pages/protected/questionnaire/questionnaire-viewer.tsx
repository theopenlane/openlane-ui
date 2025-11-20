'use client'

import { ITheme, Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

import 'survey-core/survey-core.min.css'

import { useEffect, useContext } from 'react'
import { useTheme } from 'next-themes'
import { lightTheme } from './theme-light'
import { darkTheme } from './theme-dark'
import { useGetAssessment } from '@/lib/graphql-hooks/assessments'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

export default function ViewQuestionnaire(input: { existingId: string }) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  const { data: assessmentResult } = useGetAssessment(input.existingId)
  const surveyJson = assessmentResult?.assessment?.jsonconfig
  const survey = new Model(surveyJson)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
      { label: 'Questionnaire Viewer', href: '/questionnaire-viewer' },
    ])
  }, [setCrumbs])

  if (theme === 'dark') {
    survey.applyTheme(darkTheme as ITheme)
  } else {
    survey.applyTheme(lightTheme)
  }

  survey.showCompleteButton = false
  survey.mode = 'display'

  return <Survey model={survey} />
}

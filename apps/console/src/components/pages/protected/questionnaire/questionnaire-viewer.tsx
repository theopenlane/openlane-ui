'use client'

import { ITheme, Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

import 'survey-core/defaultV2.min.css'

import { useEffect, useContext } from 'react'
import { useTheme } from 'next-themes'
import { lightTheme } from './theme-light'
import { darkTheme } from './theme-dark'
import { useGetTemplate } from '@/lib/graphql-hooks/templates'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

export default function ViewQuestionnaire(input: { existingId: string }) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  const { data: templateResult } = useGetTemplate(input.existingId)
  const surveyJson = templateResult?.template?.jsonconfig
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

'use client'

import { ITheme, Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

import 'survey-core/survey-core.min.css'

import { useEffect, useContext } from 'react'
import { useTheme } from 'next-themes'
import { lightTheme } from '../questionnaire/theme-light'
import { darkTheme } from '../questionnaire/theme-dark'
import { useGetTemplate } from '@/lib/graphql-hooks/template'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

export default function ViewTemplate(input: { existingId: string }) {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  const { data: templateResult } = useGetTemplate(input.existingId)
  const surveyJson = templateResult?.template?.jsonconfig

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Questionnaires', href: '/questionnaires' },
      { label: 'Templates', href: '/templates' },
      { label: 'Template Viewer', href: '/template-viewer' },
    ])
  }, [setCrumbs])

  if (!surveyJson) {
    return <div>Loading template...</div>
  }

  const survey = new Model(surveyJson)

  if (theme === 'dark') {
    survey.applyTheme(darkTheme as ITheme)
  } else {
    survey.applyTheme(lightTheme)
  }

  survey.showCompleteButton = false
  survey.mode = 'display'

  return <Survey model={survey} />
}

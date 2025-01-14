'use client'

import { Model } from 'survey-core'
import { Survey } from 'survey-react-ui'

import 'survey-core/defaultV2.min.css'

import { useGetTemplateQuery } from '@repo/codegen/src/schema'
import { useTheme } from 'next-themes'
import { lightTheme } from './theme-light'
import { darkTheme } from './theme-dark'

export default function ViewQuestionnaire(input: { existingId: string }) {
  // apply theme to the creator
  const themeContext = useTheme()
  const theme = themeContext.resolvedTheme as 'light' | 'dark' | 'white' | undefined

  const variables = { getTemplateId: input.existingId }
  const [templateResult] = useGetTemplateQuery({ variables })
  const surveyJson = templateResult?.data?.template?.jsonconfig
  const survey = new Model(surveyJson)

  if (theme === 'dark') {
    survey.applyTheme(darkTheme)
  } else {
    survey.applyTheme(lightTheme)
  }

  survey.showCompleteButton = false
  survey.mode = 'display'

  return <Survey model={survey} />
}

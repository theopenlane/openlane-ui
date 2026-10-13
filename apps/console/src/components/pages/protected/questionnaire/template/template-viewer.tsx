'use client'

import { Survey } from 'survey-react-ui'

import { useEffect, useMemo, use } from 'react'
import { useGetTemplate } from '@/lib/graphql-hooks/template'
import { createSurveyModel } from '@/components/shared/survey/survey-model'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

export default function ViewTemplate(input: { existingId: string }) {
  const { setCrumbs } = use(BreadcrumbContext)

  const { data: templateResult } = useGetTemplate(input.existingId)
  const surveyJson = templateResult?.template?.jsonconfig

  const survey = useMemo(() => {
    if (!surveyJson) return null
    const model = createSurveyModel(surveyJson)
    model.showCompleteButton = false
    model.mode = 'display'
    return model
  }, [surveyJson])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Templates', href: '/automation/questionnaires/templates' },
      { label: 'Template Viewer', href: '/automation/questionnaires/templates/template-viewer' },
    ])
  }, [setCrumbs])

  if (!survey) {
    return <div>Loading template...</div>
  }

  return <Survey model={survey} />
}

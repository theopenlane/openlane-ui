'use client'

import { useEffect, use } from 'react'
import { useGetAssessment } from '@/lib/graphql-hooks/assessment'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { QuestionnaireDisplay } from './questionnaire-display'

const ViewQuestionnaire = (input: { existingId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { data: assessmentResult } = useGetAssessment(input.existingId)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Questionnaires', href: '/automation/questionnaires' },
      { label: 'Questionnaire Viewer', href: '/automation/questionnaires/questionnaire-viewer' },
    ])
  }, [setCrumbs])

  return <QuestionnaireDisplay json={assessmentResult?.assessment?.jsonconfig} />
}

export default ViewQuestionnaire

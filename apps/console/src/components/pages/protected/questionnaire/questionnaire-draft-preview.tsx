'use client'

import { useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Callout } from '@/components/shared/callout/callout'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { SURVEY_PREVIEW_KEY_PARAM, useReceivedSurveyPreview } from '@/components/shared/survey/survey-preview-handoff'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { QuestionnaireDisplay } from './questionnaire-display'

const QuestionnaireDraftPreview = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const preview = useReceivedSurveyPreview(useSearchParams().get(SURVEY_PREVIEW_KEY_PARAM))

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Automation', href: '/automation' }, { label: 'Questionnaires', href: '/automation/questionnaires' }, { label: 'Preview' }])
  }, [setCrumbs])

  return (
    <div className="flex flex-col gap-4">
      <PageHeading eyebrow="Questionnaires" heading="Preview" />
      {preview.status === 'waiting' && <StatusLine>Preparing the preview. Exporting the policies to PDF can take up to a minute.</StatusLine>}
      {preview.status === 'unavailable' && <EmptyTabState title="Preview unavailable" description={preview.message} />}
      {preview.status === 'ready' && (
        <>
          <Callout variant="info" compact>
            This is a preview of what recipients will see. Nothing has been saved or sent yet.
          </Callout>
          <QuestionnaireDisplay json={preview.json} />
        </>
      )}
    </div>
  )
}

export default QuestionnaireDraftPreview

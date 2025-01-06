'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';

const QuestionnaireEditor = dynamic(() => import('@/components/pages/protected/questionnaire/questionnaire-editor'), {
  ssr: false,
})

const Page: React.FC = () => {
  const searchParams = useSearchParams()
  const existingId = searchParams.get('id') as string
  const templateId = searchParams.get('template_id') as string

  return (
    <>
      <PageHeading eyebrow="Questionnaires" heading="Editor" />

      <QuestionnaireEditor templateId={templateId} existingId={existingId} />
    </>
  )
}

export default Page

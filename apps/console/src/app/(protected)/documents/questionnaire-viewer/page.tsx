'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import dynamic from "next/dynamic";
import { useSearchParams } from 'next/navigation';
import { View } from 'lucide-react';

const ViewQuestionnaire = dynamic(() => import('@/components/pages/protected/questionnaire/questionnaire-viewer'), {
  ssr: false,
})

const Page: React.FC = () => {
  const searchParams = useSearchParams()
  const existingId = searchParams.get('id') as string

  return (
    <>
      <PageHeading eyebrow="Documents" heading="Questionnaire Viewer" />
      <ViewQuestionnaire existingId={existingId}  />
    </>
  )
}

export default Page

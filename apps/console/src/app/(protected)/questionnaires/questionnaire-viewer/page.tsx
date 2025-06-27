import React from 'react'
import QuestionnaireViewerPage from '@/components/pages/protected/questionnaire/questionnaire-viewer-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questionnaire Viewer',
}
const Page: React.FC = () => {
  return <QuestionnaireViewerPage></QuestionnaireViewerPage>
}

export default Page

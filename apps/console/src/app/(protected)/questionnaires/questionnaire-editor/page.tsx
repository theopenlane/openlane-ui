import React from 'react'
import QuestionnaireEditorPage from '@/components/pages/protected/questionnaire/questionnaire-editor-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Questionnaire Editor',
}

const Page: React.FC = () => {
  return <QuestionnaireEditorPage></QuestionnaireEditorPage>
}

export default Page

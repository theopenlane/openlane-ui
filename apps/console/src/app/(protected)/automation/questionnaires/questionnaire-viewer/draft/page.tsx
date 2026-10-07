import React from 'react'
import { type Metadata } from 'next'
import QuestionnaireDraftPreviewPage from '@/components/pages/protected/questionnaire/questionnaire-draft-preview-page'

export const metadata: Metadata = {
  title: 'Questionnaire Preview',
}

const Page: React.FC = () => <QuestionnaireDraftPreviewPage />

export default Page

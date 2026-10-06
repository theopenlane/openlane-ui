'use client'

import dynamic from 'next/dynamic'

const QuestionnaireDraftPreview = dynamic(() => import('./questionnaire-draft-preview'), { ssr: false })

const QuestionnaireDraftPreviewPage = () => <QuestionnaireDraftPreview />

export default QuestionnaireDraftPreviewPage

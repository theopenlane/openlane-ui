import React from 'react'
import TemplateViewerPage from '@/components/pages/protected/questionnaire/template/template-viewer-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Template Viewer',
}
const Page: React.FC = () => <TemplateViewerPage />

export default Page

import React from 'react'
import TemplateEditorPage from '@/components/pages/protected/template/template-editor-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Template Editor',
}

const Page: React.FC = () => <TemplateEditorPage />

export default Page

import React from 'react'
import EmailTemplateEditorPage from '@/components/pages/protected/communications/email-templates/email-template-editor-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Email Template Editor',
}

const Page: React.FC = () => <EmailTemplateEditorPage />

export default Page

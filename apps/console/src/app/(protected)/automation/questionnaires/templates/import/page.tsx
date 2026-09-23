import React from 'react'
import { type Metadata } from 'next'
import TemplateImportPage from '@/components/pages/protected/questionnaire/import/template-import-page'

export const metadata: Metadata = {
  title: 'Import Templates',
}

const Page: React.FC = () => <TemplateImportPage />

export default Page

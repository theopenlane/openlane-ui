import React from 'react'
import { type Metadata } from 'next'
import ActionPlanImportPage from '@/components/pages/protected/action-plans/import/action-plan-import-page'

export const metadata: Metadata = {
  title: 'Import Action Plans',
}

const Page: React.FC = () => <ActionPlanImportPage />

export default Page

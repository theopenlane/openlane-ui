import React from 'react'
import { type Metadata } from 'next'
import SavedReportsPage from '@/components/pages/protected/reports/saved/saved-reports-page'

export const metadata: Metadata = {
  title: 'Saved Reports',
}

const Page: React.FC = () => {
  return <SavedReportsPage />
}

export default Page

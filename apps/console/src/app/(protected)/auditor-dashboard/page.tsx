import React from 'react'
import { type Metadata } from 'next'
import AuditorDashboardPage from '@/components/pages/protected/auditor-dashboard/auditor-dashboard-page'

export const metadata: Metadata = {
  title: 'Auditor Dashboard',
}

const Page: React.FC = () => <AuditorDashboardPage />

export default Page

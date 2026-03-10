import React from 'react'
import { type Metadata } from 'next'
import ProgramsDashboardPage from '@/components/pages/protected/programs/dashboard/programs-dashboard-page'

export const metadata: Metadata = {
  title: 'Programs',
}

const Page: React.FC = () => <ProgramsDashboardPage />

export default Page

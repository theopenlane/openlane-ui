import React from 'react'
import DashboardPage from '@/components/pages/protected/dashboard/dashboard-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}

const Page: React.FC = () => <DashboardPage />

export default Page

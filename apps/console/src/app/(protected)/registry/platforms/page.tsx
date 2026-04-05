import React from 'react'
import { type Metadata } from 'next'
import PlatformsDashboardPage from '@/components/pages/protected/platforms/dashboard/platforms-dashboard-page'

export const metadata: Metadata = {
  title: 'Platform Registry',
}

const Page: React.FC = () => {
  return <PlatformsDashboardPage />
}

export default Page

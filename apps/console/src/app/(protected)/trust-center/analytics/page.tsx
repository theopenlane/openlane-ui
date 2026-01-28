import React from 'react'
import { Metadata } from 'next'
import AnalyticsPage from '@/components/pages/protected/trust-center/analytics/analytics-page'

export const metadata: Metadata = {
  title: 'Analytics | Trust center',
}

const Page: React.FC = () => {
  return <AnalyticsPage />
}

export default Page

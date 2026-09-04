import React from 'react'
import { type Metadata } from 'next'
import CustomReportPage from '@/components/pages/protected/reports/custom/custom-report-page'

export const metadata: Metadata = {
  title: 'Custom Report',
}

const Page: React.FC = () => {
  return <CustomReportPage />
}

export default Page
